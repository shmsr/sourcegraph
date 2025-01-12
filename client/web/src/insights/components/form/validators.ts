import { ValidationResult, Validator } from './hooks/useField'

/**
 * Validator for required form field which returns error massage
 * as a sign of invalid state.
 * */
export const createRequiredValidator = <Value>(errorMessage: string): Validator<Value> => (value, validity) => {
    if (validity?.valueMissing) {
        return errorMessage
    }

    return
}

/**
 * Composes a few validators together and show first error for form field.
 * */
export const composeValidators = <Value>(...validators: Validator<Value>[]): Validator<Value> => (value, validity) =>
    validators.reduce<ValidationResult>((error, validator) => error || validator(value, validity), undefined)
