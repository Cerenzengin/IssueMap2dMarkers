
import React, { useEffect, useState, useCallback } from "react";
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
import { IModelApp, ScreenViewport } from "@itwin/core-frontend";
import GeoLocationApi from "./GeoLocationApi";
import {CirclePointGenerator, CrossPointGenerator} from "./common/point-selector/PointGenerators";
import { BasePointGenerator } from './common/point-selector/PointGenerators';
import { mongoAppApi } from "./common/mongo";


//NEW POINT GENERATOR
interface IssueMarker {
  location: {
    x: number;
    y: number;
  };
  intensity: number;
}

export class UserLocationPointGenerator extends BasePointGenerator {
  private issueMarkers: IssueMarker[] = [];
  private heatmapDecorator: HeatmapDecorator;

  constructor(issueMarkers: IssueMarker[], heatmapDecorator: HeatmapDecorator) {
    super();
    this.issueMarkers = issueMarkers;
    this.heatmapDecorator = heatmapDecorator;
  }

  public generatePoints(numPoints: number, range: Range2d): Point3d[] {
    const points: Point3d[] = [];

    this.issueMarkers.forEach(issue => {
      for (let i = 0; i < issue.intensity; i++) {
        points.push(new Point3d(issue.location.x, issue.location.y, 0));
      }
    });

    return points;
  }
}

export const HeatmapDecoratorWidget = () => {
  const viewport = useActiveViewport();
  const heatmapDecorator = React.useRef<HeatmapDecorator>();
  const [userLocation, setUserLocation] = useState<Point3d | null>(null);
  const [modelSpaceLocation, setModelSpaceLocation] = useState<Point3d | null>(null);
  const [isHeatmapDisplayed, setIsHeatmapDisplayed] = useState(false);
  const [rangeState, setRangeState] = React.useState<Range2d>(Range2d.createNull());
  const [heightState, setHeightState] = React.useState<number>(0);


  const viewInit = useCallback((vp: ScreenViewport) => {

    // Grab range of the contents of the view. We'll use this to position the random markers.
    const range3d = vp.view.computeFitRange();
    // const range = Range2d.createFrom(range3d);
    const range = Range2d.createXYXY(5, 50, 7, 62);

    // We'll draw the heatmap as an overlay in the center of the view's Z extents.
    // const height = range3d.high.interpolate(0.5, range3d.low).z;

    setRangeState(range);
    setHeightState(+1);

  }, []);
 
  useEffect(() => {
    if (viewport) {
      viewInit(viewport);
    }
  }, [viewInit, viewport]);

  useEffect(() => {
    heatmapDecorator.current = HeatmapDecoratorApi.setupDecorator();

    return () => {
      if (heatmapDecorator.current)
        HeatmapDecoratorApi.disableDecorations(heatmapDecorator.current);
    };
  }, [viewport]);

  useEffect(() => {
    heatmapDecorator.current && heatmapDecorator.current.setHeight(heightState);
  }, [heightState]);

  useEffect(() => {
    heatmapDecorator.current && heatmapDecorator.current.setRange(rangeState);
  }, [rangeState]);

  useEffect(() => {
    const _loadMongoData = async () => {
      if (!viewport || !heatmapDecorator.current)
        return;
      const allIssues = await mongoAppApi.getAllIssues();

 
      const allPoints: Point3d[] = await Promise.all(allIssues.map(async (issue : any)  => {
        const cartographic = Cartographic.fromDegrees({longitude: parseFloat(issue.longitude), latitude : parseFloat(issue.latitude), height: 1 });
        const spatialLocation = await IModelApp.viewManager.selectedView!.iModel.spatialFromCartographic([cartographic]);
          if (spatialLocation.length > 0) {
          return new Point3d(spatialLocation[0].y  , spatialLocation[0].x  , spatialLocation[0].z);

        }
      }));

      // Filter out any undefined values from allPoints
      const validPoints = allPoints.filter(Boolean);
      const xs = validPoints.map(point => point.x);
      const ys = validPoints.map(point => point.y);
      const range = Range2d.createXYXY(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
      range.expandInPlace(0.05)
      heatmapDecorator.current.setPoints(validPoints);
      heatmapDecorator.current.setSpreadFactor(0.001); // Adjust as needed
      heatmapDecorator.current.setHeight(1)
      heatmapDecorator.current.setRange(range);
      HeatmapDecoratorApi.enableDecorations(heatmapDecorator.current);
      setIsHeatmapDisplayed(true);
    };
 
    _loadMongoData();
  }, [viewInit, viewport, heatmapDecorator]);


  const toggleHeatmap = () => {
    if (!viewport || !heatmapDecorator.current) { return; }
    if (isHeatmapDisplayed)  {
      HeatmapDecoratorApi.disableDecorations(heatmapDecorator.current);
    } else {
      HeatmapDecoratorApi.enableDecorations(heatmapDecorator.current);
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

