import {JSONSchema7} from "json-schema";
import {ajv} from "@event-engine/messaging/configuredAjv";
import {ValidationError} from "ajv";
import {cloneSchema, resolveRefs} from "@event-engine/messaging/resolve-refs";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {addInstanceNameToError} from "@event-engine/messaging/add-instance-name-to-error";
import {Description} from "@event-engine/infrastructure/ProophBoard/Description";

export interface ValueObjectDescription extends Description{
  name: string;
  isList: boolean;
  hasIdentifier: boolean;
}

export interface StateDescription extends ValueObjectDescription {
  identifier: string;
}

export interface StateListDescription extends ValueObjectDescription{
  itemIdentifier: string;
}

export interface ValueObjectRuntimeInfo {
  desc: ValueObjectDescription | StateDescription | StateListDescription;
  factory: ReturnType<typeof makeValueObject>;
  schema: DeepReadonly<JSONSchema7>;
}

export const makeValueObject = <T>(
  name: string,
  schema: JSONSchema7,
  definitions: {[id: string]: DeepReadonly<JSONSchema7>},
  init?: (data: Partial<T>) => T
): ((data: T) => T) => {

  if(!init) {
    init = (d): T => d as T;
  }

  if(schema.type === "object" || schema.type === "array") {
    schema = resolveRefs(cloneSchema(schema), definitions);
  }

  if(schema.$id) {
    ajv.removeSchema(schema.$id);
  }
  const validate = ajv.compile(schema);

  const validator = (payload: T): T => {
    payload = init!(payload);
    if (!validate(payload)) {
      if (validate.errors) {
        throw new ValidationError(validate.errors.map(e => addInstanceNameToError(e, name)));
      } else {
        throw new Error(`Validation for "${name}" failed for unknown reason.`);
      }
    }

    return payload as T;
  };

  const func = (data: T): T => {
    data = validator(data);
    return data;
  };

  func.toString = () => name;

  return func;
}
