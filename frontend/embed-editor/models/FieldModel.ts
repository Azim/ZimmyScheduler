// @ts-nocheck

import Field from './Field';

import {ObjectModel,StringModel,NumberModel,ArrayModel,BooleanModel,Required,ModelValue,_getPropertyModel} from '@hilla/form';
import {Email,Null,NotNull,NotEmpty,NotBlank,AssertTrue,AssertFalse,Negative,NegativeOrZero,Positive,PositiveOrZero,Size,Past,Future,Digits,Min,Max,Pattern,DecimalMin,DecimalMax} from '@hilla/form';

export default class FieldModel<T extends Field = Field> extends ObjectModel<T> { 
  static createEmptyValue: () => Field;

  get name(): StringModel {
    return this[_getPropertyModel]('name', StringModel, [false, new NotEmpty({message:"Cannot be empty"}), new Size({max:256})]);
  }

  get value(): StringModel {
    return this[_getPropertyModel]('value', StringModel, [false, new NotEmpty({message:"Cannot be empty"}), new Size({max:1024})]);
  }

  get inline(): BooleanModel {
    return this[_getPropertyModel]('inline', BooleanModel, [false]);
  }
}
