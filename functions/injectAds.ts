import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Advanced Ad Injection Service with Fixed-Position and Frequency-Based Insertion
 * 
 * Algorithm Components:
 * 1. Advertisement Pool - Active ads with targeting and frequency caps
 * 2. Fixed-Position Insertion - Ads placed every N posts during infinite scroll
 * 3. Smart Ad Selection - Weighted by priority_score (1-10) and targeting relevance
 * 4. Frequency Capping - Prevents showing same ad too often to same user
 * 
 * Priority Score System:
 * - priority_score ranges from 1 (lowest) to 10 (highest)
 * - Higher priority scores appear more frequently in the feed
 * - Priority score is the primary factor, with targeting relevance as secondary
 */
Deno.serve(async (req) => {
    // Define a default empty response structure
    const emptyResponse = {
        desktop: { left: [], right: [] },
        mobile: { inline: [] },
        tablet: { inline: [] },
        ads_to_inject: [],
        total_ads_available: 0,
        all: [],
    };

    try {
        const base44 = createClientFromRequest(req);
        
        // Parse request body to get user info and organic posts
        let body;
        try {
            body = await req.json();
        } catch (parseError) {
            console.error('Error parsing request body:', parseError);
            return new Response(JSON.stringify({ 
                ...emptyResponse,
                error: 'Invalid request body',
                details: parseError.message
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { 
            user_email = null, 
            organic_posts = [], 
            device_type = 'desktop',
            insertion_interval = 3,
            current_page = 1,
            posts_per_page = 10
        } = body;

        // Generate anonymous user ID for non-logged-in users
        const user_identifier = user_email || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`Processing ad injection for user: ${user_identifier}, posts: ${organic_posts.length}, device: ${device_type}, page: ${current_page}`);

        // Try to fetch advertisements with error handling and date filtering
        let allAds = [];
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today
            
            allAds = await base44.asServiceRole.entities.Advertisement.filter({ 
                is_active: true,
                start_date: { $lte: today.toISOString() },
                end_date: { $gte: today.toISOString() }
            });
        } catch (adError) {
            console.warn('Could not fetch advertisements:', adError.message);
            // Return empty response if no ads can be fetched
            return new Response(JSON.stringify({ 
                ...emptyResponse,
                message: 'No advertisements available - entity access error',
                debug_info: adError.message
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Filter out ads created by the current user
        const filteredAds = allAds.filter(ad => {
            if (!user_email) return true; // Show all ads to anonymous users
            return ad.created_by !== user_email; // Exclude ads created by current user
        });

        if (filteredAds.length === 0) {
            console.log('No active advertisements found for this user');
            return new Response(JSON.stringify({ 
                ...emptyResponse, 
                message: 'No active ads available for this user',
                total_ads_found: allAds.length
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Try to get recent ad impressions for frequency capping (with fallback)
        let recentImpressions = [];
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            recentImpressions = await base44.asServiceRole.entities.AdImpression.filter({
                $or: [
                    { user_email: user_email || 'no_match' },
                    { user_id: user_identifier }
                ],
                created_date: { $gte: sevenDaysAgo.toISOString() }
            });
        } catch (impressionError) {
            console.warn('Could not fetch ad impressions for frequency capping:', impressionError.message);
            // Continue without frequency capping if we can't fetch impressions
            recentImpressions = [];
        }

        console.log(`Found ${recentImpressions.length} recent impressions for user`);

        // Apply frequency capping - filter out ads shown too recently
        const now = new Date();
        const availableAds = filteredAds.filter(ad => {
            const adImpressions = recentImpressions.filter(imp => imp.ad_id === ad.id);
            
            if (adImpressions.length === 0) {
                return true; // Never shown before, always available
            }

            // Check if enough time has passed based on frequency cap
            const lastShown = new Date(Math.max(...adImpressions.map(imp => new Date(imp.created_date))));
            const hoursSinceLastShown = (now - lastShown) / (1000 * 60 * 60);
            
            const frequencyCap = ad.frequency_cap_hours || 24;
            const isAvailable = hoursSinceLastShown >= frequencyCap;
            
            if (!isAvailable) {
                console.log(`Ad ${ad.id} filtered out - shown ${hoursSinceLastShown.toFixed(1)}h ago, cap: ${frequencyCap}h`);
            }
            
            return isAvailable;
        });

        console.log(`After frequency filtering: ${availableAds.length}/${filteredAds.length} ads available`);

        if (availableAds.length === 0) {
            return new Response(JSON.stringify({ 
                ...emptyResponse,
                total_ads_available: filteredAds.length,
                message: 'All ads filtered out by frequency capping'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Analyze organic content for targeting (simple keyword matching)
        const contentKeywords = extractContentKeywords(organic_posts);
        console.log('Extracted content keywords:', contentKeywords);

        // Score ads based on priority_score (primary) and targeting relevance (secondary)
        const scoredAds = availableAds.map(ad => {
            // Priority score is the PRIMARY factor (1-10 range)
            // Multiply by 10 to give it significant weight
            const priorityWeight = (ad.priority_score || 1) * 10;
            
            // Targeting relevance is SECONDARY (bonus points)
            let targetingBonus = 0;
            
            // Boost score for targeted keywords (max 5 points)
            if (ad.target_keywords && ad.target_keywords.length > 0) {
                const keywordMatches = ad.target_keywords.filter(keyword => 
                    contentKeywords.some(contentKeyword => 
                        contentKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
                        keyword.toLowerCase().includes(contentKeyword.toLowerCase())
                    )
                );
                targetingBonus += Math.min(keywordMatches.length * 0.5, 5);
            }

            // Boost score for targeted categories (max 3 points)
            if (ad.target_categories && ad.target_categories.length > 0) {
                const categoryMatches = ad.target_categories.filter(category => 
                    contentKeywords.some(keyword => 
                        keyword.toLowerCase().includes(category.toLowerCase())
                    )
                );
                targetingBonus += Math.min(categoryMatches.length * 0.3, 3);
            }

            // Final score: Priority weight (10-100) + Targeting bonus (0-8)
            const finalScore = priorityWeight + targetingBonus;

            return {
                ...ad,
                relevanceScore: finalScore,
                priorityWeight: priorityWeight,
                targetingBonus: targetingBonus,
                keywordMatches: ad.target_keywords?.filter(keyword => 
                    contentKeywords.some(ck => ck.toLowerCase().includes(keyword.toLowerCase()))
                ) || []
            };
        });

        // Sort by relevance score (highest first)
        // Ads with priority_score 10 will have scores 100-108
        // Ads with priority_score 1 will have scores 10-18
        scoredAds.sort((a, b) => b.relevanceScore - a.relevanceScore);

        console.log('Top 5 scored ads:', scoredAds.slice(0, 5).map(ad => ({
            id: ad.id,
            title: ad.title,
            priority_score: ad.priority_score,
            priorityWeight: ad.priorityWeight,
            targetingBonus: ad.targetingBonus,
            finalScore: ad.relevanceScore,
            matches: ad.keywordMatches
        })));

        // Device-specific ad selection logic with infinite scroll support
        let selectedAds = [];
        
        if (device_type === 'desktop') {
            // Desktop: Only sidebar ads, no inline ads
            const maxSidebarAds = Math.min(scoredAds.length, 4);
            selectedAds = scoredAds.slice(0, maxSidebarAds).map((ad, index) => ({
                ...ad,
                placement_type: index % 2 === 0 ? 'sidebar_left' : 'sidebar_right'
            }));
        } else {
            // Mobile & Tablet: Only inline ads during scroll
            const uniqueAds = removeDuplicatesById(scoredAds);
            
            // Calculate which ads should appear in this "page" of content
            const adsPerPage = current_page === 1 ? 1 : 1; // Always 1 ad per scroll load
            const startIndex = (current_page - 1) * adsPerPage;
            const endIndex = startIndex + adsPerPage;
            
            const pageAds = uniqueAds.slice(startIndex, endIndex);
            
            selectedAds = pageAds.map((ad, index) => ({
                ...ad,
                placement_type: device_type === 'mobile' ? 'mobile_inline' : 'tablet_inline',
                insertion_position: insertion_interval,
                page_number: current_page
            }));
        }

        // Track impressions for the selected ads (with error handling)
        const impressionPromises = selectedAds.map(ad => {
            try {
                return base44.asServiceRole.entities.AdImpression.create({
                    user_email: user_email,
                    user_id: user_identifier,
                    ad_id: ad.id,
                    placement_type: ad.placement_type,
                    device_type: device_type,
                    context_data: {
                        content_keywords: contentKeywords,
                        relevance_score: ad.relevanceScore,
                        priority_score: ad.priority_score,
                        priority_weight: ad.priorityWeight,
                        targeting_bonus: ad.targetingBonus,
                        filtered_user_ads: true,
                        page_number: current_page,
                        infinite_scroll: true
                    }
                });
            } catch (impressionError) {
                console.warn(`Could not create impression for ad ${ad.id}:`, impressionError.message);
                return Promise.resolve(null); // Return resolved promise to avoid breaking Promise.all
            }
        });

        // Execute impression tracking (don't wait for it to complete)
        Promise.all(impressionPromises).catch(error => {
            console.error('Error tracking ad impressions:', error);
        });

        console.log(`Successfully selected and tracked ${selectedAds.length} ads for page ${current_page}`);

        // Return structured response for different layouts
        const response = {
            ads_to_inject: selectedAds,
            total_ads_available: filteredAds.length,
            ads_after_frequency_filter: availableAds.length,
            current_page: current_page,
            insertion_algorithm: {
                type: 'infinite_scroll_with_priority_and_frequency',
                device_type: device_type,
                user_ads_filtered: filteredAds.length !== allAds.length,
                supports_infinite_scroll: true,
                priority_weighting: 'priority_score (1-10) multiplied by 10 as primary factor'
            },
            desktop: {
                left: selectedAds.filter(ad => ad.placement_type === 'sidebar_left'),
                right: selectedAds.filter(ad => ad.placement_type === 'sidebar_right')
            },
            mobile: {
                inline: selectedAds.filter(ad => ad.placement_type === 'mobile_inline')
            },
            tablet: {
                inline: selectedAds.filter(ad => ad.placement_type === 'tablet_inline')
            },
            all: selectedAds
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in advanced injectAds function:', error);
        return new Response(JSON.stringify({ 
            ...emptyResponse,
            error: 'Failed to inject advertisements',
            details: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

/**
 * Extract keywords from organic post content for targeting
 */
function extractContentKeywords(posts) {
    if (!posts || !Array.isArray(posts)) return [];
    
    const keywords = new Set();
    
    posts.forEach(post => {
        if (!post) return;
        
        // Extract from title
        if (post.title) {
            const titleWords = post.title.toLowerCase().match(/\b\w{3,}\b/g) || [];
            titleWords.forEach(word => keywords.add(word));
        }
        
        // Extract from skills
        if (post.skills_needed && Array.isArray(post.skills_needed)) {
            post.skills_needed.forEach(skill => {
                if (skill && typeof skill === 'string') {
                    keywords.add(skill.toLowerCase());
                }
            });
        }
        
        // Extract from area of interest
        if (post.area_of_interest && typeof post.area_of_interest === 'string') {
            keywords.add(post.area_of_interest.toLowerCase());
        }
        
        // Extract from industry
        if (post.industry && typeof post.industry === 'string') {
            keywords.add(post.industry.toLowerCase());
        }
    });
    
    return Array.from(keywords);
}

/**
 * Remove duplicate ads by ID
 */
function removeDuplicatesById(ads) {
    if (!ads || !Array.isArray(ads)) return [];
    
    const seen = new Set();
    return ads.filter(ad => {
        if (!ad || !ad.id || seen.has(ad.id)) {
            return false;
        }
        seen.add(ad.id);
        return true;
    });
}