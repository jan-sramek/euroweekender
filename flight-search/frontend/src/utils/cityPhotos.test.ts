import { describe, expect, it } from 'vitest';
import {
  cityPhotoSrcSet,
  getCuratedCityPhoto,
  getFallbackCityPhoto,
  isUsableWikiPhoto,
  sizedWikiPhoto,
  wikipediaPhotoCacheKey,
  wikipediaTitleForCity
} from './cityPhotos';

describe('cityPhotos', () => {
  it('returns distinct curated photos for popular cities', () => {
    const rome = getCuratedCityPhoto('ROM');
    const copenhagen = getCuratedCityPhoto('CPH');
    const stockholm = getCuratedCityPhoto('STO');
    const malta = getCuratedCityPhoto('MLA');

    expect(rome).toContain('1552832230-c0197dd311b5');
    expect(copenhagen).toContain('1579126219016-fbc7f8670d6a');
    expect(stockholm).toContain('1509356843151-3e7d96241e11');
    expect(malta).toContain('1685621425871-ff24a376026b');
    expect(copenhagen).not.toBe(stockholm);
  });

  it('looks up photos by city code case-insensitively', () => {
    expect(getCuratedCityPhoto('bcn')).toContain('unsplash.com');
    expect(getCuratedCityPhoto('XYZ')).toBeNull();
  });

  it('maps ambiguous city names to a Wikipedia city page', () => {
    expect(wikipediaTitleForCity('MLA', 'Malta')).toBe('Valletta');
    expect(wikipediaTitleForCity('NCE', 'Nice')).toBe('Nice, France');
    expect(wikipediaTitleForCity('BCN', 'Barcelona')).toBe('Barcelona');
  });

  it('rejects flags, coats of arms, and SVG thumbnails', () => {
    expect(isUsableWikiPhoto('https://upload.wikimedia.org/wikipedia/commons/6/64/Flag_of_Malta.svg')).toBe(
      false
    );
    expect(
      isUsableWikiPhoto(
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Coat_of_arms_of_Malta.svg/330px-Coat_of_arms_of_Malta.svg.png'
      )
    ).toBe(false);
    expect(
      isUsableWikiPhoto('https://upload.wikimedia.org/wikipedia/commons/7/7e/Trevi_Fountain.jpg')
    ).toBe(true);
  });

  it('exposes a fallback city image', () => {
    expect(getFallbackCityPhoto()).toContain('unsplash.com');
  });

  it('versions wikipedia cache keys so stale photos can be busted', () => {
    expect(wikipediaPhotoCacheKey(' bcn ')).toBe('ew-city-photo:v3:BCN');
  });

  it('resizes Wikimedia originals and thumbs to a card-sized file', () => {
    expect(
      sizedWikiPhoto(
        'https://upload.wikimedia.org/wikipedia/commons/7/7e/Trevi_Fountain%2C_Rome.jpg'
      )
    ).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trevi_Fountain%2C_Rome.jpg/640px-Trevi_Fountain%2C_Rome.jpg'
    );
    expect(
      sizedWikiPhoto(
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trevi_Fountain%2C_Rome.jpg/330px-Trevi_Fountain%2C_Rome.jpg'
      )
    ).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trevi_Fountain%2C_Rome.jpg/640px-Trevi_Fountain%2C_Rome.jpg'
    );
  });

  it('builds an Unsplash srcset from the card URL', () => {
    const url = getCuratedCityPhoto('ROM');
    expect(url).toContain('w=480');
    expect(cityPhotoSrcSet(url ?? '')).toContain('400w');
    expect(cityPhotoSrcSet(url ?? '')).toContain('800w');
  });
});
