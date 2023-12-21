/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import React, { useEffect } from "react";
import { UiFramework } from "@itwin/appui-react";
import { ColorDef } from "@itwin/core-common";
import { StandardViewId } from "@itwin/core-frontend";
import { Viewer, ViewerViewportControlOptions } from "@itwin/web-viewer-react";
import { authClient } from "./common/AuthorizationClient";
import { mapLayerOptions } from "./common/MapLayerOptions";
import { HeatmapDecoratorWidgetProvider } from "./HeatmapDecoratorWidget";
import{ ViewSetup } from "./common/ViewSetup";

const uiProviders = [new HeatmapDecoratorWidgetProvider()];


const iTwinId = process.env.IMJS_ITWIN_ID;
const iModelId = process.env.IMJS_IMODEL_ID;

const HeatmapDecoratorApp = () => {
  /** Sign-in */
  useEffect(() => {
    void authClient.signIn();
  }, []);

  /** The sample's render method */
  return <Viewer
    iTwinId={iTwinId ?? ""}
    iModelId={iModelId ?? ""}
    authClient={authClient}
    mapLayerOptions={mapLayerOptions}
    uiProviders={uiProviders}
    defaultUiConfig={
      {
        hideNavigationAid: true,
        hideStatusBar: true,
        hideToolSettings: true,
      }
    }
    enablePerformanceMonitors={false}
    theme={process.env.THEME ?? "dark"}
  />;
};

// Define panel size
UiFramework.frontstages.onFrontstageReadyEvent.addListener((event) => {
  const { rightPanel } = event.frontstageDef;
  rightPanel && (rightPanel.size = 200);
});

export default HeatmapDecoratorApp;
