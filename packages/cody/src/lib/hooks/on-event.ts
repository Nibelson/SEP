import {CodyHook, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "./context";
import {CodyResponseException, withErrorCheck} from "./utils/error-handling";
import {names} from "@event-engine/messaging/helpers";
import {getSingleSource, isCodyError} from "@proophboard/cody-utils";
import {detectService} from "./utils/detect-service";
import {getNodeFromSyncedNodes} from "./utils/node-tree";
import {findAggregateState} from "./utils/aggregate/find-aggregate-state";
import {getVoMetadata} from "./utils/value-object/get-vo-metadata";
import {flushChanges} from "nx/src/generators/tree";
import {formatFiles, generateFiles} from "@nx/devkit";
import {toJSON} from "./utils/to-json";
import {updateProophBoardInfo} from "./utils/prooph-board-info";
import {namespaceToFilePath, namespaceToJSONPointer} from "./utils/value-object/namespace";
import {register, registerEventReducer} from "./utils/registry";
import {listChangesForCodyResponse} from "./utils/fs-tree";
import {createApplyFunctionRegistryIfNotExists} from "./utils/aggregate/create-apply-function-registry";
import {alwaysMapPayload} from "./utils/event/always-map-payload";
import {convertRuleConfigToEventReducerRules} from "./utils/rule-engine/convert-rule-config-to-behavior";
import {EventMeta, getEventMetadata} from "./utils/event/get-event-metadata";
import {ensureAllRefsAreKnown} from "./utils/json-schema/ensure-all-refs-are-known";
import {getOriginalEvent} from "@cody-engine/cody/hooks/utils/event/get-original-event";


export const onEvent: CodyHook<Context> = async (event: Node, ctx: Context) => {
  try {
    event = getOriginalEvent(event, ctx);
    const eventNames = names(event.getName());
    const aggregate = getSingleSource(event, NodeType.aggregate);

    const service = withErrorCheck(detectService, [event, ctx]);
    const serviceNames = names(service);
    const meta = withErrorCheck(getEventMetadata, [event, ctx]) as EventMeta;

    const isAggregateEvent = !isCodyError(aggregate);

    if(isCodyError(aggregate)) {
      // @TODO: handle non-aggregate event
      return aggregate;
    }

    const aggregateNames = names(aggregate.getName());

    const syncedAggregate = withErrorCheck(getNodeFromSyncedNodes, [aggregate, ctx.syncedNodes]);
    const aggregateState = withErrorCheck(findAggregateState, [syncedAggregate, ctx]);
    const aggregateStateMeta = withErrorCheck(getVoMetadata, [aggregateState, ctx]);
    const aggregateStateNames = names(aggregateState.getName());

    withErrorCheck(ensureAllRefsAreKnown, [event, meta.schema]);

    const {tree} = ctx;

    generateFiles(tree, __dirname + '/event-files/shared', ctx.sharedSrc, {
      'tmpl': '',
      'service': serviceNames.fileName,
      'aggregate': aggregateNames.fileName,
      serviceNames,
      aggregateNames,
      aggregateStateNames: {
        ...aggregateStateNames,
        classNameWithNamespace: `${namespaceToJSONPointer(aggregateStateMeta.ns)}${aggregateStateNames.className}`,
      },
      isAggregateEvent,
      aggregateIdentifier: aggregateStateMeta.identifier,
      toJSON,
      ...eventNames,
      schema: meta.schema,
      ...withErrorCheck(updateProophBoardInfo, [event, ctx, tree])
    });

    withErrorCheck(register, [event, ctx, tree]);
    withErrorCheck(createApplyFunctionRegistryIfNotExists, [syncedAggregate, ctx, tree]);

    const rules = meta.applyRules || [];

    if(rules.length === 0) {
      rules.push(withErrorCheck(alwaysMapPayload, [event, aggregateState, ctx]));
    }

    generateFiles(tree, __dirname + '/event-files/be', ctx.beSrc, {
      'tmpl': '',
      'service': serviceNames.fileName,
      'aggregate': aggregateNames.fileName,
      serviceNames,
      aggregateNames,
      aggregateStateNames: {
        ...aggregateStateNames,
        fileNameWithNamespace: `${namespaceToFilePath(aggregateStateMeta.ns)}${aggregateStateNames.fileName}`,
      },
      ...eventNames,
      rules: withErrorCheck(convertRuleConfigToEventReducerRules, [event, ctx, rules]),
    });

    withErrorCheck(registerEventReducer, [service, event, syncedAggregate, ctx, tree]);

    await formatFiles(tree);

    const changes = tree.listChanges();

    flushChanges(ctx.projectRoot, changes);

    return {
      cody: `Done! The app has a new event called "${event.getName()}".`,
      details: listChangesForCodyResponse(tree),
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
