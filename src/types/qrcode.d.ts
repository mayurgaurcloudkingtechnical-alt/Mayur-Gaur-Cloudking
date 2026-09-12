declare module "qrcode" {
  export interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toDataURL(
    text: string | Buffer,
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  export function toString(
    text: string | Buffer,
    options?: { type: "svg" | "utf8"; margin?: number; width?: number }
  ): Promise<string>;
}
