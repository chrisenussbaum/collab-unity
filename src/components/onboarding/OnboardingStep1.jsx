import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Camera, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function OnboardingStep1({
  username,
  setUsername,
  fullName,
  setFullName,
  profileImage,
  setProfileImage,
  usernameError,
  isCheckingUsername,
  isUploadingImage,
  onImageUpload,
  onNext,
  isSubmitting,
  currentUser
}) {
  const profileImageInputRef = useRef(null);

  const handleFileChange = (e) => {
    onImageUpload(e, setProfileImage);
  };

  const isValid = username.trim() && fullName.trim() && profileImage && !usernameError;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        ref={profileImageInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Profile Photo */}
      <div>
        <Label className="text-base font-medium mb-2 block">
          Profile Photo <span className="text-red-500">*</span>
        </Label>
        <div className="flex flex-col items-center space-y-3">
          <div
            onClick={() => !isUploadingImage && profileImageInputRef.current.click()}
            className="cursor-pointer w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors overflow-hidden"
          >
            {isUploadingImage ? (
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            ) : profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => profileImageInputRef.current.click()}
            disabled={isUploadingImage}
          >
            <Upload className="w-4 h-4 mr-2" />
            {profileImage ? 'Change Photo' : 'Upload Photo'}
          </Button>
        </div>
      </div>

      {/* Username */}
      <div>
        <Label htmlFor="username" className="text-base font-medium mb-2 block">
          Username <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-500 mb-3">
          This will be part of your profile URL (e.g., collabunity.io/@{username || 'yourname'})
        </p>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500">@</span>
          </div>
          <Input
            id="username"
            placeholder="yourname"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            maxLength={30}
            className={`pl-7 ${usernameError ? 'border-red-500' : ''}`}
            disabled={isSubmitting || isCheckingUsername}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
        {isCheckingUsername && (
          <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
        )}
        {usernameError && (
          <p className="text-xs text-red-600 mt-1">{usernameError}</p>
        )}
        {username && !usernameError && !isCheckingUsername && username !== currentUser?.username && (
          <p className="text-xs text-green-600 mt-1">✓ Username is available</p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <Label htmlFor="fullName" className="text-base font-medium mb-2 block">
          Full Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fullName"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <Button
        onClick={onNext}
        className="cu-button w-full"
        disabled={!isValid || isSubmitting || isCheckingUsername}
      >
        Continue
      </Button>
    </motion.div>
  );
}