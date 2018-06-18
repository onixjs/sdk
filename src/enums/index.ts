'use strict';
/**
 * @author Jonathan Casarrubias
 * @enum OperationType
 * @description Enum used for system level operations.
 */
export const enum OperationType {
  /*0*/ APP_CREATE,
  /*1*/ APP_CREATE_RESPONSE,
  /*2*/ APP_PING,
  /*3*/ APP_PING_RESPONSE,
  /*4*/ APP_START,
  /*5*/ APP_START_RESPONSE,
  /*6*/ APP_STOP,
  /*7*/ APP_STOP_RESPONSE,
  /*8*/ APP_DESTROY,
  /*9*/ APP_DESTROY_RESPONSE,
  /*10*/ APP_GREET,
  /*11*/ APP_GREET_RESPONSE,
  /*12*/ ONIX_REMOTE_CALL_STREAM,
  /*13*/ ONIX_REMOTE_CALL_PROCEDURE,
  /*14*/ ONIX_REMOTE_CALL_PROCEDURE_RESPONSE,
  /*15*/ ONIX_REMOTE_CALL_STREAM_SUBSCRIBED,
  /*16*/ ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE,
  /*17*/ ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE_RESPONSE,
  /*18*/ ONIX_REMOTE_REGISTER_CLIENT,
  /*19*/ ONIX_REMOTE_REGISTER_CLIENT_RESPONSE,
  /*20*/ ONIX_REMOTE_UNREGISTER_CLIENT,
  /*21*/ ONIX_REMOTE_UNREGISTER_CLIENT_RESPONSE,
}
// Required because of different http modules
export const enum RuntimeEnvironment {
  /*0*/ BROWSER,
  /*1*/ NODE_JS,
}
