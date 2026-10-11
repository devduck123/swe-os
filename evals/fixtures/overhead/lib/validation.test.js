import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePassword, validateEmail } from './validation.js';

test('short passwords are rejected', () => {
  assert.equal(validatePassword('abc'), 'Password must be atleast 8 charaters');
  assert.equal(validatePassword('long enough'), null);
});

test('emails need an @', () => {
  assert.equal(validateEmail('nope'), 'Enter a valid email');
});
