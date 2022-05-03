// @ts-nocheck

import EmbedAuthorModel from './EmbedAuthorModel';
import EmbedFooterModel from './EmbedFooterModel';
import EmbedImageModel from './EmbedImageModel';
import FieldModel from './FieldModel';
import Embed from './Embed';
import * as cnst from './Constants';

import {ObjectModel,StringModel,NumberModel,ArrayModel,BooleanModel,Required,ModelValue,_getPropertyModel} from '@hilla/form';
import {Email,Null,NotNull,NotEmpty,NotBlank,AssertTrue,AssertFalse,Negative,NegativeOrZero,Positive,PositiveOrZero,Size,Past,Future,Digits,Min,Max,Pattern,DecimalMin,DecimalMax} from '@hilla/form';

export default class EmbedModel<T extends Embed = Embed> extends ObjectModel<T> { 
  static createEmptyValue: () => Embed;

  get title(): StringModel {
    return this[_getPropertyModel]('title', StringModel, [true, new Size({max:256})]);
  }

  get description(): StringModel {
    return this[_getPropertyModel]('description', StringModel, [true, new Size({max:4096})]);
  }

  get url(): StringModel {
    return this[_getPropertyModel]('url', StringModel, [true, new Pattern({regexp:cnst.urlPattern, message:"Invalid url"})]);
  }

  get timestamp(): StringModel {
    return this[_getPropertyModel]('timestamp', StringModel, [true]);
  }

  get color(): NumberModel {
    return this[_getPropertyModel]('color', NumberModel, [true]);
  }

  get footer(): EmbedFooterModel {
    return this[_getPropertyModel]('footer', EmbedFooterModel, [true]);
  }

  get image(): EmbedImageModel {
    return this[_getPropertyModel]('image', EmbedImageModel, [true]);
  }

  get thumbnail(): EmbedImageModel {
    return this[_getPropertyModel]('thumbnail', EmbedImageModel, [true]);
  }

  get author(): EmbedAuthorModel {
    return this[_getPropertyModel]('author', EmbedAuthorModel, [true]);
  }

  get fields(): ArrayModel<ModelValue<FieldModel>, FieldModel> {
    return this[_getPropertyModel]('fields', ArrayModel, [false, FieldModel, [true]]);
  }
}
