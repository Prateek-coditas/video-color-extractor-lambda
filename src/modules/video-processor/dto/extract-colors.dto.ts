export class ExtractColorsDto {
  videoUrl: string;
  timestamps?: number[];
  percentages?: number[];
}

export class ColorResultDto {
  timestamp: number;
  color: string;
}

export class ExtractColorsResponseDto {
  videoUrl: string;
  results: ColorResultDto[];
}