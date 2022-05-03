// @ts-nocheck

import EmbedImage from './EmbedImage';
import * as cnst from './Constants';
import {ObjectModel,StringModel,NumberModel,ArrayModel,BooleanModel,Required,ModelValue,_getPropertyModel} from '@hilla/form';
import {Email,Null,NotNull,NotEmpty,NotBlank,AssertTrue,AssertFalse,Negative,NegativeOrZero,Positive,PositiveOrZero,Size,Past,Future,Digits,Min,Max,Pattern,DecimalMin,DecimalMax} from '@hilla/form';

export default class EmbedImageModel<T extends EmbedImage = EmbedImage> extends ObjectModel<T> { 
  static createEmptyValue: () => EmbedImage;

  get url(): StringModel {
    return this[_getPropertyModel]('url', StringModel, [true, new Pattern({regexp:cnst.urlPattern, message:"Invalid url"})]);
  }

  get proxy_url(): StringModel {
    return this[_getPropertyModel]('proxy_url', StringModel, [true]);
  }

  get height(): NumberModel {
    return this[_getPropertyModel]('height', NumberModel, [true]);
  }

  get width(): NumberModel {
    return this[_getPropertyModel]('width', NumberModel, [true]);
  }
}
