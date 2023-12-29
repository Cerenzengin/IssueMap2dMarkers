import React, { useEffect, useState } from "react";
import {
  StagePanelLocation,
  StagePanelSection,
  UiItemsProvider,
  useActiveViewport,
  Widget,
  WidgetState
} from "@itwin/appui-react";
import { Alert, Label, Slider, ToggleSwitch, Button } from "@itwin/itwinui-react";
import { Point3d, Range2d } from "@itwin/core-geometry";
import { Cartographic } from "@itwin/core-common";
import HeatmapDecorator from "./HeatmapDecorator";
import HeatmapDecoratorApi from "./HeatmapDecoratorApi";
import { IModelApp } from "@itwin/core-frontend";

export const HeatmapDecoratorWidget = () => {
  const viewport = useActiveViewport();
  const [heatmapDecorator, setHeatmapDecorator] = useState<HeatmapDecorator | null>(null);
  const [userLocation, setUserLocation] = useState<Point3d | null>(null);
  const [isHeatmapDisplayed, setIsHeatmapDisplayed] = useState<boolean>(false);

  useEffect(() => {
    setHeatmapDecorator(HeatmapDecoratorApi.setupDecorator());
  }, []);

  const fetchUserLocation = async () => {
    navigator.geolocation.getCurrentPosition(async position => {
      const userGeoLocation = new Point3d(position.coords.longitude, position.coords.latitude, 0);
      setUserLocation(userGeoLocation);
    }, error => {
      console.error("Error getting user's geolocation:", error.message);
      setUserLocation(null);
    });
  };

  const displayHeatmap = async () => {
    if (!userLocation || !viewport || !heatmapDecorator) {
      console.log("Cannot display heatmap: user location or viewport is not available.");
      return;
    }

    const cartesian = Cartographic.fromDegrees({longitude: userLocation.x, latitude: userLocation.y, height: 0});
    const spatialLocation = await IModelApp.viewManager.selectedView!.iModel.spatialFromCartographic([cartesian]);

    if (spatialLocation.length > 0) {
      heatmapDecorator.setPoints([spatialLocation[0]]);
      heatmapDecorator.setSpreadFactor(10); // Example spread factor
      heatmapDecorator.setRange(new Range2d(-100, -100, 100, 100)); // Define your range here
      HeatmapDecoratorApi.enableDecorations(heatmapDecorator);
      setIsHeatmapDisplayed(true);
      console.log(`Heatmap can be displayed on the map at coordinates: ${spatialLocation[0].toString()}`);
    }
  };

  useEffect(() => {
    fetchUserLocation();
  }, []);

  return (
    <div className="sample-options">
      <div className="sample-grid">
        <Alert type="informational" className="no-icon">
          Use the button to display the heatmap based on your location.
        </Alert>
        <Button onClick={displayHeatmap}>Show Heatmap</Button>
        {isHeatmapDisplayed && userLocation && (
          <div>
            <p>Heatmap is displayed on the map.</p>
            <p>Coordinates: {userLocation.toString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export class HeatmapDecoratorWidgetProvider implements UiItemsProvider {
  public readonly id = "HeatmapDecoratorWidgetProvider";

  public provideWidgets(_stageId: string, _stageUsage: string, location: StagePanelLocation, _section?: StagePanelSection): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];
    if (location === StagePanelLocation.Right) {
      widgets.push({
        id: "HeatmapDecoratorWidget",
        label: "Heatmap Decorator Selector",
        defaultState: WidgetState.Open,
        content: <HeatmapDecoratorWidget />
      });
    }
    return widgets;
  }
};
