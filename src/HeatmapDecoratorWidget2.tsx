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
import GeoLocationApi from "./GeoLocationApi";
import {CirclePointGenerator, CrossPointGenerator} from "./common/point-selector/PointGenerators";
import { BasePointGenerator } from './common/point-selector/PointGenerators';


export const HeatmapDecoratorWidget = () => {
  const viewport = useActiveViewport();
  const [heatmapDecorator, setHeatmapDecorator] = useState(new HeatmapDecorator());
  const [userLocation, setUserLocation] = useState<Point3d | null>(null);
  const [modelSpaceLocation, setModelSpaceLocation] = useState<Point3d | null>(null);
  const [isHeatmapDisplayed, setIsHeatmapDisplayed] = useState(false);


  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userGeoLocation = new Point3d(position.coords.longitude, position.coords.latitude, 0);
        setUserLocation(userGeoLocation);

        const cartographic = Cartographic.fromDegrees({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          height: 0
        });

        const spatialLocation = await IModelApp.viewManager.selectedView!.iModel.spatialFromCartographic([cartographic]);
        if (spatialLocation.length > 0) {
          setModelSpaceLocation(spatialLocation[0]);
          const size = 1;
          const allPoints: Point3d[] = [];
          
          const topLeft = new Point3d(spatialLocation[0].x - size / 10, spatialLocation[0].y - size / 10, spatialLocation[0].z);
          const topRight = new Point3d(spatialLocation[0].x + size / 10, spatialLocation[0].y - size / 10, spatialLocation[0].z);
          const bottomLeft = new Point3d(spatialLocation[0].x - size / 10, spatialLocation[0].y + size / 10, spatialLocation[0].z);
          const bottomRight = new Point3d(spatialLocation[0].x + size / 10, spatialLocation[0].y + size / 10, spatialLocation[0].z);
          
          allPoints.push(topLeft, topRight, bottomLeft, bottomRight);
          const circlePoints = new CrossPointGenerator().generatePoints(1, Range2d.createXYXY(bottomLeft.x, bottomLeft.y, topRight.x, topRight.y));
          heatmapDecorator.setPoints(circlePoints);
          heatmapDecorator.setSpreadFactor(2); // Adjust as needed
          const range = Range2d.createXYXY(bottomLeft.x, bottomLeft.y, topRight.x, topRight.y);
          // heatmapDecorator.setRange(Range2d.createXY(spatialLocation[0].x, spatialLocation[0].y)); // Set range based on model coordinates
          heatmapDecorator.setRange(range); // Set range based on model coordinates
          heatmapDecorator.setHeight(0)
          HeatmapDecoratorApi.enableDecorations(heatmapDecorator);
          setIsHeatmapDisplayed(true);
        }
      },
      (error) => {
        console.error("Error getting user's geolocation:", error.message);
      }
    );
  }, [viewport]);

  const toggleHeatmap = () => {
    if (isHeatmapDisplayed) {
      HeatmapDecoratorApi.disableDecorations(heatmapDecorator);
    } else {
      HeatmapDecoratorApi.enableDecorations(heatmapDecorator);
    }
    setIsHeatmapDisplayed(!isHeatmapDisplayed);
  };

  return (
    <div className="sample-options">
      <div className="sample-grid">
        <Alert type="informational" className="no-icon">
          Click the button to display the heatmap at your location.
        </Alert>
        <Button onClick={toggleHeatmap}>
          {isHeatmapDisplayed ? "Hide Heatmap" : "Show Heatmap"}
        </Button>
        {isHeatmapDisplayed && modelSpaceLocation && (
          <div>
            <p>Heatmap displayed on the map.</p>
            <p>Model Space Coordinates: X: {modelSpaceLocation.x.toFixed(6)}, Y: {modelSpaceLocation.y.toFixed(6)}</p>
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
