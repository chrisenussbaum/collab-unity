/**
 * Dynamically updates document.title and Open Graph / Twitter meta tags.
 * LinkedIn's crawler renders JavaScript, so updating these tags client-side
 * after data loads changes the social preview card.
 *
 * @param {object} opts - { title, description, image, url }
 */
export function updateMetaTags({ title, description, image, url }) {
  if (title) {
    document.title = title;
    setMetaProperty('og:title', title);
    setMetaName('twitter:title', title);
  }
  if (description) {
    setMetaProperty('og:description', description);
    setMetaName('twitter:description', description);
    setMetaName('description', description);
  }
  if (image) {
    setMetaProperty('og:image', image);
    setMetaName('twitter:image', image);
  }
  if (url) {
    setMetaProperty('og:url', url);
  }
}

function setMetaProperty(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaName(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}