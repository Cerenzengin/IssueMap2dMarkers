import React, { useEffect, useState } from "react";
import {
  StagePanelLocation,
  StagePanelSection,
  UiItemsProvider,
  useActiveViewport,
  Widget,
  WidgetState
} from "@itwin/appui-react";
import { Alert, Button } from "@itwin/itwinui-react";
import { Point3d, Range2d } from "@itwin/core-geometry";
import { Cartographic } from "@itwin/core-common";
import HeatmapDecorator from "./HeatmapDecorator";
import HeatmapDecoratorApi from "./HeatmapDecoratorApi";
import { IModelApp } from "@itwin/core-frontend";

export const HeatmapDecoratorWidget = () => {
  const viewport = useActiveViewport();
  const [heatmapDecorator] = useState(new HeatmapDecorator());
  const [userLocation, setUserLocation] = useState<Point3d | null>(null);
  const [isHeatmapDisplayed, setIsHeatmapDisplayed] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userGeoLocation = new Point3d(position.coords.longitude, position.coords.latitude, 0);
        setUserLocation(userGeoLocation);
      },
      (error) => {
        console.error("Error getting user's geolocation:", error.message);
        setUserLocation(null);
      }
    );
  }, []);

  const handleShowHeatmap = async () => {
    if (!userLocation || !viewport) {
      console.error("User location or viewport is not available.");
      return;
    }

    const cartesian = [Cartographic.fromDegrees({longitude: userLocation.x, latitude: userLocation.y, height: 0})];
    const spatialLocation = await IModelApp.viewManager.selectedView!.iModel.spatialFromCartographic(cartesian);

    if (spatialLocation.length > 0) {
      heatmapDecorator.setPoints(spatialLocation);
      heatmapDecorator.setSpreadFactor(700);
      heatmapDecorator.setRange(new Range2d(-100, -100, 100, 100));
      HeatmapDecoratorApi.enableDecorations(heatmapDecorator);
      setIsHeatmapDisplayed(true);
    }
  };

  return (
    <div className="sample-options">
      <div className="sample-grid">
        <Alert type="informational" className="no-icon">
          Click the button to show the heatmap based on your current location.
        </Alert>
        <Button onClick={handleShowHeatmap}>Show Heatmap</Button>
        {isHeatmapDisplayed && userLocation && (
          <div>
            <p>Heatmap displayed on the map.</p>
            <p>Latitude: {userLocation.y.toFixed(6)}, Longitude: {userLocation.x.toFixed(6)}</p>
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
