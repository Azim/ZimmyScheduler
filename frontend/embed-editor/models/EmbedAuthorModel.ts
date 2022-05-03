// @ts-nocheck

import EmbedAuthor from './EmbedAuthor';
import * as cnst from './Constants';
import {ObjectModel,StringModel,NumberModel,ArrayModel,BooleanModel,Required,ModelValue,_getPropertyModel} from '@hilla/form';
import {Email,Null,NotNull,NotEmpty,NotBlank,AssertTrue,AssertFalse,Negative,NegativeOrZero,Positive,PositiveOrZero,Size,Past,Future,Digits,Min,Max,Pattern,DecimalMin,DecimalMax} from '@hilla/form';

export default class EmbedAuthorModel<T extends EmbedAuthor = EmbedAuthor> extends ObjectModel<T> { 
  static createEmptyValue: () => EmbedAuthor;

  get name(): StringModel {
    return this[_getPropertyModel]('name', StringModel, [true, new Size({max:256})]);
  }

  get url(): StringModel {
    return this[_getPropertyModel]('url', StringModel, [true, new Pattern({regexp:cnst.urlPattern, message:"Invalid url"})]);
  }

  get icon_url(): StringModel {
    return this[_getPropertyModel]('icon_url', StringModel, [true, new Pattern({regexp:cnst.urlPattern, message:"Invalid url"})]);
  }

  get proxy_icon_url(): StringModel {
    return this[_getPropertyModel]('proxy_icon_url', StringModel, [true, new Pattern({regexp:cnst.urlPattern, message:"Invalid url"})]);
  }
}
