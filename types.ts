export enum BlendMode {
  NORMAL = 'source-over',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
  DARKEN = 'darken',
  LIGHTEN = 'lighten',
  HARD_LIGHT = 'hard-light',
  SOFT_LIGHT = 'soft-light',
  DIFFERENCE = 'difference',
  LIGHTER = 'lighter',
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number; // 0 to 1
  y: number; // 0 to 1
  fontSize: number; // in pixels
  color: string;
  backgroundColor: string;
  padding: number;
  borderRadius: number;
  lineHeight: number;
}


export interface SpiralSettings {
  centerX: number; // 0 to 1 (percentage of width)
  centerY: number; // 0 to 1 (percentage of height)
  spacing: number; // Distance between spiral arms
  thickness: number; // Line thickness
  rotation: number; // Rotation in radians
  color: string;
  opacity: number;
  blendMode: BlendMode;
  isConcentric: boolean; // True for circles, False for spiral
  
  // Canvas
  aspectRatio: string; // 'original', '1:1', '9:16', etc.

  // Background & Quality
  blur: number; // Background blur in pixels
  antiAliasing: boolean;

  // Double Spiral
  isDouble: boolean;
  secondaryColor: string;
  
  // Deformation
  deformationAmount: number;
  deformationFrequency: number;

  // Sparkle Effect
  sparkleAmount: number;
  sparkleSize: number;
  sparkleOpacity: number;
  sparkleColor: string;
  sparkleBlur: number;
}

export interface ExportedSettings {
  spiral: SpiralSettings;
  text: Omit<TextOverlay, 'id'>[];
}
