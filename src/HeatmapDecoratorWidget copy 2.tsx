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
  const [heatmapDecorator] = useState(new HeatmapDecorator());
  const [userLocation, setUserLocation] = useState<Point3d | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userGeoLocation:Point3d = new Point3d(position.coords.longitude, position.coords.latitude, 0);
        setUserLocation(userGeoLocation);
      },
      (error) => {
        console.error("Error getting user's geolocation:", error.message);
        const defaultLocation = new Point3d(50, 6, 0); // Adjust this default location as needed
        setUserLocation(defaultLocation);
      }
    );

  }, [viewport, heatmapDecorator]);

  return (
    <div className="sample-options">
      <div className="sample-grid">
        <Alert type="informational" className="no-icon">
          Use the options to control the heatmap visualization.
        </Alert>
        <ToggleSwitch label="Show heatmap" checked={true} onChange={() => {}} />
        <div>
          <Label>Spread Factor</Label>
          <Slider min={0} max={100} values={[10]} step={1} onChange={() => {}} onUpdate={() => {}} disabled={false} />
        </div>
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
