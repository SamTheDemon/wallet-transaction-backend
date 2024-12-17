import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import axios from 'axios';



// Key Features:
// Fetch conversion rates from a public API.
// Cache the rates in Redis for 1 hour (EX, 3600 seconds).
// Use Redis to quickly retrieve rates if already cached.
@Injectable()
export class CurrencyService {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest';

  async getConversionRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const cacheKey = `${fromCurrency}:${toCurrency}`;
    const cachedRate = await this.redis.get(cacheKey);

    if (cachedRate) {
      return parseFloat(cachedRate);
    }

    // Fetch conversion rates from the public API
    const { data } = await axios.get(`${this.API_URL}/${fromCurrency}`);
    const conversionRate = data.rates[toCurrency];

    if (!conversionRate) {
      throw new Error(`Unable to fetch conversion rate for ${fromCurrency} to ${toCurrency}`);
    }

    // Cache the rate for 1 hour
    await this.redis.set(cacheKey, conversionRate, 'EX', 3600);

    return conversionRate;
  }
}
