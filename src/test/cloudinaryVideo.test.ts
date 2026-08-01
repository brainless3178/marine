import { describe, it, expect } from 'vitest'
import {
  HERO_VIDEO_BREAKPOINTS,
  getHeroHlsUrl,
  getHeroPosterJpgUrl,
  getHeroPosterSrcSet,
  getHeroPosterUrl,
  getHeroVideoUrl,
  supportsNativeHls,
} from '../lib/cloudinaryVideo'

describe('getHeroVideoUrl', () => {
  it('applies all required transformations for each breakpoint', () => {
    expect(getHeroVideoUrl('mobile')).toBe(
      'https://res.cloudinary.com/y7up4zti/video/upload/q_auto,f_auto,vc_auto,adu,w_720,c_limit/hero_apy76l.mp4'
    )
    expect(getHeroVideoUrl('tablet')).toBe(
      'https://res.cloudinary.com/y7up4zti/video/upload/q_auto,f_auto,vc_auto,adu,w_1280,c_limit/hero_apy76l.mp4'
    )
    expect(getHeroVideoUrl('desktop')).toBe(
      'https://res.cloudinary.com/y7up4zti/video/upload/q_auto,f_auto,vc_auto,adu,w_1920,c_limit/hero_apy76l.mp4'
    )
  })

  it('supports an explicit numeric width', () => {
    expect(getHeroVideoUrl(1000)).toContain('w_1000,c_limit')
  })

  it('defaults to the desktop source', () => {
    expect(getHeroVideoUrl()).toContain('w_1920,c_limit')
  })

  it('always references the CDN video path, never the raw asset', () => {
    const url = getHeroVideoUrl('mobile')
    expect(url).toContain('/video/upload/')
    expect(url).not.toContain('hero_apy76l.mp4" alone') // sanity: has transforms
    expect(url).not.toBe('https://res.cloudinary.com/y7up4zti/video/upload/hero_apy76l')
  })
})

describe('getHeroHlsUrl / supportsNativeHls', () => {
  it('builds an adaptive HLS manifest with sp_auto + fl_streaming', () => {
    expect(getHeroHlsUrl()).toBe(
      'https://res.cloudinary.com/y7up4zti/video/upload/sp_auto,fl_streaming/hero_apy76l.m3u8'
    )
  })

  it('detects native HLS support for Safari and iOS', () => {
    expect(supportsNativeHls('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15')).toBe(true)
    expect(supportsNativeHls('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1')).toBe(true)
  })

  it('does not flag Chrome, Firefox, Edge or Android as native HLS', () => {
    expect(supportsNativeHls('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36')).toBe(false)
    expect(supportsNativeHls('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0')).toBe(false)
    expect(supportsNativeHls('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 Edg/125.0')).toBe(false)
    expect(supportsNativeHls('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36')).toBe(false)
  })
})

describe('getHeroPosterUrl', () => {
  it('delivers a WebP frame at the configured offset with responsive widths', () => {
    expect(getHeroPosterUrl('mobile')).toBe(
      'https://res.cloudinary.com/y7up4zti/video/upload/q_auto:good,w_720,c_limit,so_1/hero_apy76l.webp'
    )
    expect(getHeroPosterUrl('tablet')).toContain('w_1280,c_limit')
    expect(getHeroPosterUrl('desktop')).toContain('w_1920,c_limit')
  })

  it('provides a jpg fallback with the same frame and size', () => {
    expect(getHeroPosterJpgUrl('desktop')).toBe(getHeroPosterUrl('desktop').replace('.webp', '.jpg'))
  })

  it('builds a srcSet covering all breakpoints, smallest first', () => {
    const srcSet = getHeroPosterSrcSet()
    const widths = srcSet.split(', ').map((part) => part.split(' ')[1])
    expect(widths).toEqual(['720w', '1280w', '1920w'])
    expect(srcSet).toContain(`q_auto:good,w_${HERO_VIDEO_BREAKPOINTS.mobile},c_limit`)
  })
})
