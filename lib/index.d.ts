/**
 * Wrapper for Jitterentropy True Random Number Generator
 */
export declare class JitterTrng {
  /**
   * Create a new random number generator
   * @param osr Controls oversampling, pass `1` to not oversample. Default is `1`.
   * @param flags Internal flags changes the bahaviour of the TRNG. Default is `NONE`.
   */
  constructor(
    osr?: number,
    flags?: JitterentropyFlags
  );

  /**
   * Collect some random bytes from the Jitterentropy with provided buffer.
   * @param buf The buffer object to contain the random bytes.
   * @param size How many bytes to be collected, maximum is the buffer size.
   * @returns A number that indicates how many bytes has been collected to the buffer. Zero or negative values means something wrong is happened, please refer to mandoc `Jitterentropy(3)` for details.
   */
  read(buf: Buffer, size?: number): number;

  readAsync(buf: Buffer, size?: number): Promise<number>;
  readAsync(buf: Buffer, callback: (err: Error, count: number) => void): void;
  readAsync(buf: Buffer, size: number, callback: (err: Error, count: number) => void): void;

  /**
   * Generate a float-point number between 0 and 1.
   */
  random(): number;

  /**
   * Generate a float-point number between 0 and the value given.
   * @param max The number that generated number must not greater or equals to
   */
  random(max: number): number;

  /**
   * Generate a float-point number between the values given.
   * @param low The number that generated number must not smaller to
   * @param high The number that generated number must not greater or equals to
   */
  random(low: number, high: number): number;

  randomAsync(): Promise<number>;
  randomAsync(max: number): Promise<number>;
  randomAsync(low: number, high: number): Promise<number>;
  randomAsync(callback: (err: Error, result: number) => void): void;
  randomAsync(max: number, callback: (err: Error, result: number) => void): void;
  randomAsync(low: number, high: number, callback: (err: Error, result: number) => void): void;

  /**
   * Generate a integer number between 0 and the value given.
   * @param max The number that generated number must not greater or equals to
   */
  randomInt(max: number): number;
  
  /**
   * Generate a integer number between the values given.
   * @param low The number that generated number must not smaller to
   * @param high The number that generated number must not greater or equals to
   */
  randomInt(low: number, high: number): number;

  randomIntAsync(max: number): Promise<number>;
  randomIntAsync(low: number, high: number): Promise<number>;
  randomIntAsync(max: number, callback: (err: Error, result: number) => void): void;
  randomIntAsync(low: number, high: number, callback: (err: Error, result: number) => void): void;

  /**
   * Get a buffer that fills with random bytes.
   * @param byteCount How many bytes should be in the buffer.
   * @returns A buffer fill with random bytes, but keep in mind that it still has chance that entropy does not enough to fufill the count requested.
   */
  generate(byteCount: number): Buffer;

  generateAsync(byteCount: number): Promise<Buffer>;
  generateAsync(byteCount: number, callback: (err: Error, result: Buffer) => void): void;
}

/**
 * Flags that controls the behaviour of Jitterentropy TRNG.
 * For the usage details please refer to the mandoc `Jitterentropy(3)`.
 */
export declare enum JitterentropyFlags {
  NONE = 0,
  /**
   * Disables theuse of the stirring function with the
   * newly generated random number before it is given to the caller.
   */
  JENT_DISABLE_STIR = 1,
  /**
   * Disables the Von-Neumann unbias operation.
   */
  JENT_DISABLE_UNBIAS = 2,
  /**
   * Disables the allocation of thatmemory and therefore memory accesses.
   * But that also implies that the entropycollection process onlyrelies
   * on the complexity of the CPU.
   */
  JENT_DISABLE_MEMORY_ACCESS = 4,
}