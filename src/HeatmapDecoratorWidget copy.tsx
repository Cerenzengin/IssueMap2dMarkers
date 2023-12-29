// HeatmapDecoratorWidget.tsx

import React, { useCallback, useEffect, useState } from "react";
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
import GeoLocationApi from "./GeoLocationApi";
import { IModelApp } from "@itwin/core-frontend";

export const HeatmapDecoratorWidget = () => {
  const viewport = useActiveViewport();
  const heatmapDecorator = React.useRef<HeatmapDecorator>(new HeatmapDecorator());
  const [userLocation, setUserLocation] = useState<Point3d | null>(null);
  
  const handleAddMarkerClick = async () => {
    if (!viewport) {
      console.error("Viewport is not available.");
      return;
    }
  
    if (!userLocation) {
      console.error("User location is not available.");
      return;
    }
    const cartesian : Cartographic[] =  [];
    cartesian.push(Cartographic.fromDegrees({longitude : userLocation.x, latitude : userLocation.y, height : 0}))
    const spatialLocation = await IModelApp.viewManager.selectedView!.iModel.spatialFromCartographic(cartesian);
  
    };
    

  useEffect(() => {
    // Additional useEffect logic if needed
  }, []);

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
        <Button onClick={handleAddMarkerClick}>Add User Location to Heatmap</Button>
      </div>
    </div>
  );
};

export class HeatmapDecoratorWidgetProvider implements UiItemsProvider {
  public readonly id: string = "HeatmapDecoratorWidgetProvider";

  public provideWidgets(_stageId: string, _stageUsage: string, location: StagePanelLocation, _section?: StagePanelSection): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];
    if (location === StagePanelLocation.Right) {
      widgets.push(
        {
          id: "HeatmapDecoratorWidget",
          label: "Heatmap Decorator Selector",
          defaultState: WidgetState.Open,
          content: <HeatmapDecoratorWidget />,
        }
      );
    }
    return widgets;
  }
}
