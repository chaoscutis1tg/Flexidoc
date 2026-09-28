import React from 'react';
import { mmToPx } from './layoutUtils.js';

export const ImageRenderer = ({ image, templateId, versionId, scale = 1 }) => {
  if (!image) return null;

  // Resolve image URL
  let imgSrc = image.src;
  if (!imgSrc && image.mediaPath) {
    const imageName = image.mediaPath.split('/').pop();
    if (templateId && versionId) {
      imgSrc = `/api/templates/${templateId}/images/${versionId}/${imageName}`;
    }
  }

  if (!imgSrc) {
    return null;
  }

  const style = {
    maxWidth: '100%',
    height: 'auto',
    display: 'inline-block',
    margin: '4px 0',
  };

  if (image.width) {
    style.width = `${mmToPx(image.width, scale)}px`;
  }
  if (image.height) {
    style.height = `${mmToPx(image.height, scale)}px`;
  }

  return (
    <div style={{ textAlign: image.alignment || 'left', width: '100%' }}>
      <img src={imgSrc} alt={image.altText || 'DOCX Image'} style={style} />
    </div>
  );
};
