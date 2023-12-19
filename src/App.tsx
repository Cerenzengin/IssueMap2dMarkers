/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./App.scss";
import { DigercodWidgetProvider } from "./Digercod";
import { MarkerPinWidgetProvider } from "./MarkerPinWidget"; 
//import { MarkerPinApp } from "./MarkerPinWidget"; 
import { ViewerViewportControlOptions } from "@itwin/web-viewer-react";
import { ViewSetup } from "./common/ViewSetup";
import { UiFramework } from "@itwin/appui-react";
import { mapLayerOptions } from "./common/MapLayerOptions";

import { DisplayStyle3dProps, GlobeMode,} from "@itwin/core-common";

import { FitViewTool, IModelApp, StandardViewId, ScreenViewport } from "@itwin/core-frontend";
import { FillCentered } from "@itwin/core-react";
import { ProgressLinear } from "@itwin/itwinui-react";
import {
  MeasurementActionToolbar,
  MeasureTools,
  MeasureToolsUiItemsProvider,
} from "@itwin/measure-tools-react";
import {
  AncestorsNavigationControls,
  CopyPropertyTextContextMenuItem,
  PropertyGridManager,
  PropertyGridUiItemsProvider,
  ShowHideNullValuesSettingsMenuItem,
} from "@itwin/property-grid-react";
import {
  TreeWidget,
  TreeWidgetUiItemsProvider,
} from "@itwin/tree-widget-react";
import {
  useAccessToken,
  Viewer,
  ViewerContentToolsProvider,
  ViewerNavigationToolsProvider,
  ViewerPerformance,
  ViewerStatusbarItemsProvider,
} from "@itwin/web-viewer-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Auth } from "./Auth";
import { history } from "./history";

const uiProviders = [new MarkerPinWidgetProvider()];
const viewportOptions: ViewerViewportControlOptions = {
  viewState: async (iModelConnection) => {
    const viewState = await ViewSetup.getDefaultView(iModelConnection);

    // The marker pins look better in a top view
    viewState.setStandardRotation(StandardViewId.Top);

    const range = viewState.computeFitRange();
    const aspect = viewState.getAspectRatio();    

    viewState.lookAtVolume(range, aspect);

    return viewState;
  },
};

const iTwinId = process.env.IMJS_ITWIN_ID;
const iModelId = process.env.IMJS_IMODEL_ID;



const App: React.FC = () => {
  const [iModelId, setIModelId] = useState(process.env.IMJS_IMODEL_ID);
  const [iTwinId, setITwinId] = useState(process.env.IMJS_ITWIN_ID);
  const [changesetId, setChangesetId] = useState(
    process.env.IMJS_AUTH_CLIENT_CHANGESET_ID
  );
  // Add state for API keys
  const [bingMapsKey, setBingMapsKey] = useState(
   process.env.IMJS_BING_MAPS_KEY || "ApVESqqc5C48K9smPp5LgpMUCNnfYiQJndhuCPbqUifN5x9XaD2yXCWy4FqQ6KSR"
 );
 const [mapboxKey, setMapboxKey] = useState(
   process.env.IMJS_MAPBOX_KEY || "pk.eyJ1IjoiY2VyZW56ZW5naW4iLCJhIjoiY2xwaDExeDd3MDJvbTJrdDN6bWhxeHI5YSJ9.mFKaszJah-f5AAfp9scLxg"
 );
 const [cesiumAssetId, setCesiumAssetId] = useState(
   process.env.IMJS_CESIUM_ASSET_ID || "eyJqdGkiOiI1ZmE5OTExZi1kYWJhLTRlMzQtYWE2Yi0yN2JhYmZjMTM5NzkiLCJpZCI6MTgxMDM1LCJpYXQiOjE3MDEwOTY4NDF9"
 );
 
  const accessToken = useAccessToken();

  const authClient = Auth.getClient();

  const login = useCallback(async () => {
    try {
      await authClient.signInSilent();
    } catch {
      await authClient.signIn();
    }
  }, [authClient]);

  useEffect(() => {
    void login();
  }, [login]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("iTwinId")) {
      setITwinId(urlParams.get("iTwinId") as string);
    }
    if (urlParams.has("iModelId")) {
      setIModelId(urlParams.get("iModelId") as string);
    }
    if (urlParams.has("changesetId")) {
      setChangesetId(urlParams.get("changesetId") as string);
    }
  }, []);

  useEffect(() => {
    let url = `viewer?iTwinId=${iTwinId}`;

    if (iModelId) {
      url = `${url}&iModelId=${iModelId}`;
    }

    if (changesetId) {
      url = `${url}&changesetId=${changesetId}`;
    }
    history.push(url);
  }, [iTwinId, iModelId, changesetId]);

  /** NOTE: This function will execute the "Fit View" tool after the iModel is loaded into the Viewer.
   * This will provide an "optimal" view of the model. However, it will override any default views that are
   * stored in the iModel. Delete this function and the prop that it is passed to if you prefer
   * to honor default views when they are present instead (the Viewer will still apply a similar function to iModels that do not have a default view).
   */
  const viewConfiguration = useCallback((viewPort: ScreenViewport) => {
    // default execute the fitview tool and use the iso standard view after tile trees are loaded
    const tileTreesLoaded = () => {
      return new Promise((resolve, reject) => {
        const start = new Date();
        const intvl = setInterval(() => {
          if (viewPort.areAllTileTreesLoaded) {
            ViewerPerformance.addMark("TilesLoaded");
            ViewerPerformance.addMeasure(
              "TileTreesLoaded",
              "ViewerStarting",
              "TilesLoaded"
            );
            clearInterval(intvl);
            resolve(true);
          }
          const now = new Date();
          // after 20 seconds, stop waiting and fit the view
          if (now.getTime() - start.getTime() > 20000) {
            reject();
          }
        }, 100);
      });
    };

    tileTreesLoaded().finally(() => {
      void IModelApp.tools.run(FitViewTool.toolId, viewPort, true, false);
      viewPort.view.setStandardRotation(StandardViewId.Iso);
    });
  }, []);

  const viewCreatorOptions = useMemo(
    () => ({ viewportConfigurer: viewConfiguration }),
    [viewConfiguration]
  );

  const onIModelAppInit = useCallback(async () => {
    // iModel now initialized
    await TreeWidget.initialize();
    await PropertyGridManager.initialize();
    await MeasureTools.startup();
    MeasurementActionToolbar.setDefaultActionProvider();
  }, []);

  UiFramework.frontstages.onFrontstageReadyEvent.addListener((event) => {
    const { bottomPanel } = event.frontstageDef;
    bottomPanel && (bottomPanel.size = 250);
  });
  
  return (
    <div className="viewer-container">
      {!accessToken && (
        <FillCentered>
          <div className="signin-content">
            <ProgressLinear indeterminate={true} labels={["Signing in..."]} />
          </div>
        </FillCentered>
      )}
      <Viewer
        iTwinId={iTwinId ?? ""}
        iModelId={iModelId ?? ""}
        changeSetId={changesetId}
        authClient={authClient}
        viewportOptions={viewportOptions}
        viewCreatorOptions={viewCreatorOptions}
        enablePerformanceMonitors={true} // see description in the README (https://www.npmjs.com/package/@itwin/web-viewer-react)
        onIModelAppInit={onIModelAppInit}
        uiProviders={[
          new DigercodWidgetProvider(),
          new ViewerNavigationToolsProvider(),
          new ViewerContentToolsProvider({
            vertical: {
              measureGroup: false,
            },
          }),
          new ViewerStatusbarItemsProvider(),
          new TreeWidgetUiItemsProvider(),
          new PropertyGridUiItemsProvider({
            propertyGridProps: {
              autoExpandChildCategories: true,
              ancestorsNavigationControls: (props) => (
                <AncestorsNavigationControls {...props} />
              ),
              contextMenuItems: [
                (props) => <CopyPropertyTextContextMenuItem {...props} />,
              ],
              settingsMenuItems: [
                (props) => (
                  <ShowHideNullValuesSettingsMenuItem
                    {...props}
                    persist={true}
                  />
                ),
              ],
            },
          }),
          new MeasureToolsUiItemsProvider(),
          //Custom Providers:
          new MarkerPinWidgetProvider (),
          //new MarkerPinApp (), 
        ]}
        // Bing and Mapbox keys:
        mapLayerOptions = { {BingMaps: { key: "key", value: bingMapsKey},
                            MapboxImagery: { key: "access_token", value: mapboxKey}} }

        //Cesium Terrain
        //tileAdmin = { {cesiumIonKey: CesiumKey  }}         

      />
    </div>
  );
};

export default App;

