// @ts-nocheck

import EmbedFooter from './EmbedFooter';
import * as cnst from './Constants';
import {ObjectModel,StringModel,NumberModel,ArrayModel,BooleanModel,Required,ModelValue,_getPropertyModel} from '@hilla/form';
import {Email,Null,NotNull,NotEmpty,NotBlank,AssertTrue,AssertFalse,Negative,NegativeOrZero,Positive,PositiveOrZero,Size,Past,Future,Digits,Min,Max,Pattern,DecimalMin,DecimalMax} from '@hilla/form';

export default class EmbedFooterModel<T extends EmbedFooter = EmbedFooter> extends ObjectModel<T> { 
  static createEmptyValue: () => EmbedFooter;

  get text(): StringModel {
    return this[_getPropertyModel]('text', StringModel, [true, new Size({max:2048})]);
  }

  get icon_url(): StringModel {
    return this[_getPropertyModel]('icon_url', StringModel, [true, new Pattern({regexp:cnst.urlPattern, message:"Invalid url"})]);
  }

  get proxy_icon_url(): StringModel {
    return this[_getPropertyModel]('proxy_icon_url', StringModel, [true, new Pattern({regexp:cnst.urlPattern, message:"Invalid url"})]);
  }
}
