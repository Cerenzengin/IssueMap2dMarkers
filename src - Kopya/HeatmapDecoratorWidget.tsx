/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import React, { useCallback, useEffect, useMemo } from "react";
import {
  StagePanelLocation,
  StagePanelSection,
  UiItemsProvider,
  useActiveViewport,
  Widget,
  WidgetState
} from "@itwin/appui-react";
import { ScreenViewport } from "@itwin/core-frontend";
import { Point3d, Range2d } from "@itwin/core-geometry";
import { Alert, Label, Slider, ToggleSwitch } from "@itwin/itwinui-react";
import { PointSelector } from "./common/point-selector/PointSelector";
import HeatmapDecorator from "./HeatmapDecorator";
import HeatmapDecoratorApi from "./HeatmapDecoratorApi";
import "./HeatmapDecorator.scss";

export const HeatmapDecoratorWidget = () => {
  const viewport = useActiveViewport();
  const [showDecoratorState, setShowDecoratorState] = React.useState<boolean>(true);
  const [spreadFactorState, setSpreadFactorState] = React.useState<number>(10);
  const [pointsState, setPointsState] = React.useState<Point3d[]>([]);
  const [rangeState, setRangeState] = React.useState<Range2d>(Range2d.createNull());
  const [heightState, setHeightState] = React.useState<number>(0);
  const heatmapDecorator = React.useRef<HeatmapDecorator>();

  useEffect(() => {
    heatmapDecorator.current = HeatmapDecoratorApi.setupDecorator();
    return () => {
      if (heatmapDecorator.current)
        HeatmapDecoratorApi.disableDecorations(heatmapDecorator.current);
    };
  }, [viewport]);

  const viewInit = useCallback((vp: ScreenViewport) => {

    // Grab range of the contents of the view. We'll use this to position the random markers.
    const range3d = vp.view.computeFitRange();
    const range = Range2d.createFrom(range3d);

    // We'll draw the heatmap as an overlay in the center of the view's Z extents.
    // const height = range3d.high.interpolate(0.5, range3d.low).z;

    setRangeState(range);
    setHeightState(-5.099571943283081);

  }, []);

  /** When the images are loaded, initialize the MarkerPin */
  useEffect(() => {
    if (viewport) {
      viewInit(viewport);
    }
  }, [viewInit, viewport]);

  useEffect(() => {
    heatmapDecorator.current && heatmapDecorator.current.setHeight(heightState);
  }, [heightState]);

  useEffect(() => {
    heatmapDecorator.current && heatmapDecorator.current.setRange(rangeState);
  }, [rangeState]);

  // Effect when the points get updated
  useEffect(() => {
    heatmapDecorator.current && heatmapDecorator.current.setPoints(pointsState);
  }, [pointsState]);

  useEffect(() => {
    heatmapDecorator.current && heatmapDecorator.current.setSpreadFactor(spreadFactorState);
  }, [spreadFactorState]);

  useEffect(() => {
    if (heatmapDecorator.current) {
      if (showDecoratorState)
        HeatmapDecoratorApi.enableDecorations(heatmapDecorator.current);
      else
        HeatmapDecoratorApi.disableDecorations(heatmapDecorator.current);
    }
  }, [showDecoratorState]);

  const _onPointsChanged = useCallback((p: Point3d[]) => {
    setPointsState(p);
  }, []);

  const onChangeSpreadFactor = (values: readonly number[]) => {
    setSpreadFactorState(values[0]);
  };

  const sliderValues = useMemo(() => [spreadFactorState], [spreadFactorState]);

  return (
    <div className="sample-options">
      <div className="sample-grid">
        <Alert type="informational" className="no-icon">
          Use the options to control the heatmap visualization.
        </Alert>
        <ToggleSwitch label="Show heatmap" checked={showDecoratorState} onChange={() => setShowDecoratorState(!showDecoratorState)} />
        <PointSelector onPointsChanged={_onPointsChanged} range={rangeState} />
        <div>
          <Label>Spread Factor</Label>
          <Slider min={0} max={100} values={sliderValues} step={1} onChange={onChangeSpreadFactor} onUpdate={onChangeSpreadFactor} disabled={!showDecoratorState} />
        </div>
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
