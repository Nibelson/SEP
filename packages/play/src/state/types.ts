import {PageDefinition, TopLevelPage} from "@frontend/app/pages/page-definitions";
import React from "react";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  AggregateCommandDescription,
  AggregateDescription,
  AggregateEventDescription,
  CommandDescription,
  EventDescription, PolicyDescription, QueryableStateDescription, QueryableStateListDescription,
  QueryableValueObjectDescription,
  QueryDescription,
  StateDescription,
  StateListDescription,
  ValueObjectDescription
} from "@event-engine/descriptions/descriptions";
import {AnyRule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {JSONSchema7} from "json-schema";
import {UiSchema} from "@rjsf/utils";
import {DynamicBreadcrumbMetadata} from "@cody-engine/cody/hooks/utils/ui/types";
import {ResolveConfig, TableUiSchema} from "@cody-engine/cody/hooks/utils/value-object/types";

/* UI */
export type PlayPageDefinition = Omit<PageDefinition, 'breadcrumb'> & {breadcrumb: string | DynamicBreadcrumbMetadata, service: string};

export type PlayTopLevelPage = Omit<Omit<TopLevelPage, 'sidebar'>, 'breadcrumb'> & {sidebar: {label: string, icon: string, invisible?: string | boolean}} & PlayPageDefinition;

export interface PlaySubLevelPage extends PlayPageDefinition {
  routeParams: string[];
}

export type PlayPageRegistry = {[pageName: string]: PlayPageDefinition};

export type PlayViewRegistry = {
  [valueObjectName: string]: React.FunctionComponent<any> | { information: string };
};



export interface PlayInitAction {
  type: 'INIT',
  payload: CodyPlayConfig,
}

export interface PlayAddPageAction {
  type: 'ADD_PAGE',
  name: string,
  page: PlayPageDefinition,
}

export interface PlayAddCommandAction {
  type: 'ADD_COMMAND',
  name: string,
  command: PlayCommandRuntimeInfo,
}

export interface PlayAddTypeAction {
  type: 'ADD_TYPE',
  name: string,
  information: PlayInformationRuntimeInfo,
  definition: {
    definitionId: string,
    schema: JSONSchema7
  }
}

export interface PlayAddQueryAction {
  type: 'ADD_QUERY',
  name: string,
  query: PlayQueryRuntimeInfo,
  resolver: ResolveConfig,
}

export interface PlayAddAggregateAction {
  type: 'ADD_AGGREGATE',
  name: string,
  command: string,
  aggregate: AggregateDescription,
  businessRules: AnyRule[]
}

export interface PlayAddAggregateEventAction {
  type: 'ADD_AGGREGATE_EVENT',
  name: string,
  aggregate: string,
  event: PlayEventRuntimeInfo,
  reducer: AnyRule[],
}

export interface PlayAddEventPolicyAction {
  type: 'ADD_EVENT_POLICY',
  name: string,
  event: string,
  desc: PlayEventPolicyDescription,
}

/* Commands */
export type PlayCommandRegistry = {
  [commandName: string]: PlayCommandRuntimeInfo;
}

export interface PlayCommandRuntimeInfo {
  desc: CommandDescription | AggregateCommandDescription;
  factory: AnyRule[],
  schema: DeepReadonly<JSONSchema7>,
  uiSchema?: UiSchema,
}

export type PlayCommandHandlerRegistry = {
  [commandName: string]: AnyRule[];
}

/* Queries */
export type PlayQueryRegistry = {
  [queryName: string]: PlayQueryRuntimeInfo;
}

export interface PlayQueryRuntimeInfo {
  desc: QueryDescription,
  factory: AnyRule[],
  schema: DeepReadonly<JSONSchema7>,
}

export type PlayResolverRegistry = {
  [queryName: string]: ResolveConfig;
}

/* Information */
export type PlayInformationRegistry = {
  [informationName: string]: PlayInformationRuntimeInfo;
}

export interface PlayInformationRuntimeInfo {
  desc: ValueObjectDescription | StateDescription | StateListDescription | QueryableValueObjectDescription | QueryableStateDescription | QueryableStateListDescription;
  factory: AnyRule[];
  schema: DeepReadonly<JSONSchema7>;
  uiSchema?: UiSchema & TableUiSchema;
}

/* Aggregates */
export type PlayAggregateRegistry = {
  [aggregateName: string]: AggregateDescription;
}

/* Event Policies */
export type PlayEventPolicyRegistry = {
  [eventName: string]: {
    [policyName: string]: PlayEventPolicyDescription
  };
}

export type PlayEventPolicyDescription = PolicyDescription & { rules: AnyRule[] };

/* Events */
export type PlayEventRegistry = {
  [eventName: string]: PlayEventRuntimeInfo;
}

export interface PlayEventRuntimeInfo {
  desc: EventDescription | AggregateEventDescription;
  factory: AnyRule[];
  schema: DeepReadonly<JSONSchema7>;
}

export type PlayEventReducers = {
  [eventName: string]: AnyRule[]
};

export type PlayApplyRulesRegistry = {
  [aggregateName: string]: PlayEventReducers
}

/* Definitions */
export type PlaySchemaDefinitions = {
  [definitionId: string]: JSONSchema7;
}
