import * as v from 'valibot';

export const positiveNumberSchema = v.pipe(v.number(), v.gtValue(0));

export const positiveIntegerSchema = v.pipe(v.number(), v.integer(), v.minValue(1));

export const slugSchema = v.pipe(v.string(), v.regex(/^[\da-z]+(?:-[\da-z]+)*$/));

export const nonEmptyStringSchema = v.pipe(v.string(), v.trim(), v.nonEmpty());

export const urlSchema = v.pipe(v.string(), v.url());
