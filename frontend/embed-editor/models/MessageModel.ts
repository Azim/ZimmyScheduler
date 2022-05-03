// @ts-nocheck

import AllowedMentionsModel from './AllowedMentionsModel';
import EmbedModel from './EmbedModel';
import Message from './Message';
import * as cnst from './Constants';

import {ObjectModel,StringModel,NumberModel,ArrayModel,BooleanModel,Required,ModelValue,_getPropertyModel} from '@hilla/form';
import {Email,Null,NotNull,NotEmpty,NotBlank,AssertTrue,AssertFalse,Negative,NegativeOrZero,Positive,PositiveOrZero,Size,Past,Future,Digits,Min,Max,Pattern,DecimalMin,DecimalMax} from '@hilla/form';

export default class MessageModel<T extends Message = Message> extends ObjectModel<T> { 
  static createEmptyValue: () => Message;

  get content(): StringModel {
    return this[_getPropertyModel]('content', StringModel, [true, new Size({max:2000})]);
  }

  get username(): StringModel {
    return this[_getPropertyModel]('username', StringModel, [true, new Size({max:80})]);
  }

  get avatar_url(): StringModel {
    return this[_getPropertyModel]('avatar_url', StringModel, [true, new Pattern({regexp:cnst.urlPattern, message:"Invalid url"})]);
  }

  get embeds(): ArrayModel<ModelValue<EmbedModel>, EmbedModel> {
    return this[_getPropertyModel]('embeds', ArrayModel, [false, EmbedModel, [true]]);
  }

  get allowed_mentions(): AllowedMentionsModel {
    return this[_getPropertyModel]('allowed_mentions', AllowedMentionsModel, [true]);
  }
}
