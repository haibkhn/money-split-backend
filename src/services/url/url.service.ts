import { Injectable } from '@nestjs/common';

@Injectable()
export class UrlService {
  private readonly base62Chars =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  encodeId(uuid: string): string {
    const hex = uuid.replace(/-/g, '');
    const decimal = BigInt(`0x${hex}`);
    return this.toBase62(decimal);
  }

  decodeId(shortId: string): string {
    const decimal = this.fromBase62(shortId);
    const hex = decimal.toString(16).padStart(32, '0');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  private toBase62(decimal: bigint): string {
    if (decimal === BigInt(0)) return '0';
    let result = '';
    let value = decimal;
    while (value > BigInt(0)) {
      result = this.base62Chars[Number(value % BigInt(62))] + result;
      value = value / BigInt(62);
    }
    return result;
  }

  private fromBase62(str: string): bigint {
    let result = BigInt(0);
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const value = this.base62Chars.indexOf(char);
      if (value === -1) throw new Error('Invalid base62 character: ' + char);
      result = result * BigInt(62) + BigInt(value);
    }
    return result;
  }
}
