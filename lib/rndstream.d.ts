/// <reference types="node" />

import { Readable, ReadableOptions } from 'stream';
import { JitterentropyFlags } from './wrapper';

/**
 * Buffered random pool from the results of Jitterentropy as a readable stream.
 * Provide a more convenient, non-blocking way to use the random generator.
 */
export declare class RandomStream extends Readable {
  /**
   * Construct a buffered random pool.  
   * Have a reminder that this stream works asynchronously and the random bytes cannot
   * serve immediately thus you might result getting `undefined` if you
   * impatient to get the random numbers.
   * @param highWaterMark High water mark indicates the stream will going to
   * fill until the amount of bytes reach this number, default is `16384` (16kb).
   * Higher values will take more time (depends on the running speed of the machine)
   * to fill up and get ready to use and lower values will drain the stream more quickly
   * @param osr Oversampling, default is `1` (No oversample)
   * @param flags Flags controls the Jitterentropy behaviour
   */
  constructor(highWaterMark?: number, osr?: number, flags?: JitterentropyFlags);
  constructor(options: ReadableOptions, osr?: number, flags?: JitterentropyFlags);

  /**
   * Pops a positive integer number from the random buffer.  
   * This method is the core of other helper functions which pops a number in this class.
   * @param bytes how many bytes does the number requires, minumum is 1 and maximum is 6
   * @returns A random positive integer number between 0 and (`2 ^ (bytes * 8)`),
   * or `undefined` if the random bits are not yet available
   */
  next(bytes: number): number | undefined;

  /**
   * Pops a float-point number between 0 and 1.
   */
  random(): number | undefined;

  /**
   * Pops a float-point number between 0 and the value given.
   * @param max The number that generated number must not greater or equals to
   */
  random(max: number): number | undefined;

  /**
   * Pops a float-point number between the values given.
   * @param min The number that generated number must not smaller to
   * @param max The number that generated number must not greater or equals to
   */
  random(min: number, max: number): number | undefined;
  
  /**
   * Pops an integer number between 0 and the value given.
   * @param max The number that generated number must not greater or equals to
   */
  randomInt(max: number): number | undefined;

  /**
   * Pops an integer number between the values given.
   * @param min The number that generated number must not smaller to
   * @param max The number that generated number must not greater or equals to
   */
  randomInt(min: number, max: number): number | undefined;

  /**
   * Creates a random pool stream in a promise which resolves when it is ready to use.
   * @param highWaterMark High water mark indicates the stream will going to
   * fill until the amount of bytes reach this number, default is `16384` (16kb).
   * Higher values will take more time (depends on the running speed of the machine)
   * to fill up and get ready to use and lower values will drain the stream more quickly
   * @param osr Oversampling, default is `1` (No oversample)
   * @param flags Flags controls the Jitterentropy behaviour
   */
  static create(highWaterMark?: number, osr?: number, flags?: JitterentropyFlags): Promise<RandomStream>;
  static create(options: ReadableOptions, osr?: number, flags?: JitterentropyFlags): Promise<RandomStream>;
}