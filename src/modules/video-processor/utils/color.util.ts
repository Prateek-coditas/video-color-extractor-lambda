import { getAverageColor } from 'fast-average-color-node';

export class ColorUtil {

  static async extractDominantColor(imageBuffer: Buffer): Promise<string> {
    try {
      const color = await getAverageColor(imageBuffer, {
        algorithm: 'dominant', 
        mode: 'speed',         
        silent: true,          
      });

      return color.hex.toUpperCase();
    } catch (error) {
      throw new Error(`Failed to extract color: ${error.message}`);
    }
  }
  
  /**
   * Alternative: Extract average color (faster, less vibrant)
   * Use this if dominant colors are too saturated for your use case
   */
  static async extractAverageColor(imageBuffer: Buffer): Promise<string> {
    try {
      const color = await getAverageColor(imageBuffer, {
        algorithm: 'sqrt',
        mode: 'speed',
        silent: true,
      });

      return color.hex.toUpperCase();
    } catch (error) {
      throw new Error(`Failed to extract average color: ${error.message}`);
    }
  }
}