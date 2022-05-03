// @ts-nocheck

import AllowedMentions from './AllowedMentions';
import {ObjectModel,StringModel,NumberModel,ArrayModel,BooleanModel,Required,ModelValue,_getPropertyModel} from '@hilla/form';
import {Email,Null,NotNull,NotEmpty,NotBlank,AssertTrue,AssertFalse,Negative,NegativeOrZero,Positive,PositiveOrZero,Size,Past,Future,Digits,Min,Max,Pattern,DecimalMin,DecimalMax} from '@hilla/form';

export default class AllowedMentionsModel<T extends AllowedMentions = AllowedMentions> extends ObjectModel<T> { 
  static createEmptyValue: () => AllowedMentions;

  get parse(): ArrayModel<string, StringModel> {
    return this[_getPropertyModel]('parse', ArrayModel, [false, StringModel, [true]]);
  }

  get roles(): ArrayModel<string, StringModel> {
    return this[_getPropertyModel]('roles', ArrayModel, [true, StringModel, [true]]);
  }

  get users(): ArrayModel<string, StringModel> {
    return this[_getPropertyModel]('users', ArrayModel, [true, StringModel, [true]]);
  }
}
