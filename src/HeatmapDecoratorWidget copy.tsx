
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
import { getRandomValue } from "@itwin/itwinui-react/cjs/core/utils";


type IssueType = "flood" | "road" | "lightening" | "maintenance" | "noise" | "crime"  | "garbage" | "other" | "all";


// Define an interface for issue data
interface Issue {
  issueType: "flood" | "road" | "lightening" | "maintenance" | "noise" | "crime" | "garbage" | "other";
  longitude: number;
  latitude: number;
  // ... include other properties as they appear in your data
}
/*/NEW POINT GENERATOR
interface IssueMarker {
  location: {
    x: number;
    y: number;
  };
  intensity: number;
}

export class UserLocationPointGenerator extends BasePointGenerator {
  private issueMarkers: IssueMarker[] = [];

  public generatePoints(numPoints: number, range: Range2d): Point3d[] {
    const points: Point3d[] = [];

    this.issueMarkers.forEach(issue => {
      for (let i = 0; i < issue.intensity; i++) {
        points.push(new Point3d(issue.location.x, issue.location.y, i*10));
      }
    });

    return points;
  }
}
*/

export const HeatmapDecoratorWidget = () => {
  const viewport = useActiveViewport();
  const heatmapDecorator = React.useRef<HeatmapDecorator>();
  const [userLocation, setUserLocation] = useState<Point3d | null>(null);
  const [modelSpaceLocation, setModelSpaceLocation] = useState<Point3d | null>(null);
  const [isHeatmapDisplayed, setIsHeatmapDisplayed] = useState(false);
  const [rangeState, setRangeState] = React.useState<Range2d>(Range2d.createNull());
  const [heightState, setHeightState] = React.useState<number>(0);
  const [selectedIssueType, setSelectedIssueType] = useState<string>("all"); // "all" for all types or specific type


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



// Utility functions to calculate weights and intensity
function squaredDistance(p1: Point3d, p2: Point3d): number {
  return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
}

function calculateWeights(points: Point3d[]): number[] {
  const weights = points.map(_ => 0);

  points.forEach((point, index) => {
    points.forEach((otherPoint, otherIndex) => {
      if (index !== otherIndex) {
        weights[index] += squaredDistance(point, otherPoint);
      }
    });
  });

  return weights;
}

function scaleWeights(weights: number[]): number[] {
  const maxWeight = Math.max(...weights);
  const minWeight = Math.min(...weights);

  return weights.map(weight => 0.25 + ((weight - minWeight) / (maxWeight - minWeight)) * 0.75);
}


  const _loadMongoData = async () => {
    if (!viewport || !heatmapDecorator.current)
      return;
    const allIssues = await mongoAppApi.getAllIssues();


     // Filter issues based on selectedIssueType
     //const filteredIssues = allIssues.filter((issue: Issue) => selectedIssueType === "all" || issue.issueType === selectedIssueType);
    // Filter issues based on selectedIssueType
     const filteredIssues = selectedIssueType === "all" 
    ? allIssues 
    : allIssues.filter((issue: Issue) => issue.issueType === selectedIssueType);

    let allPoints: Point3d[] = await Promise.all(filteredIssues.map(async (issue : any)  => {
      const cartographic = Cartographic.fromDegrees({longitude: parseFloat(issue.longitude), latitude : parseFloat(issue.latitude), height: 1 });
      const spatialLocation = await IModelApp.viewManager.selectedView!.iModel.spatialFromCartographic([cartographic]);
        if (spatialLocation.length > 0) {
        return new Point3d(spatialLocation[0].x  , spatialLocation[0].y  , spatialLocation[0].z);
      }
    }));

    allPoints = allPoints.filter(Boolean); // Filter out any undefined values
    const weights = calculateWeights(allPoints);
    const scaledWeights = scaleWeights(weights);
    allPoints = allPoints.map((point, index) => new Point3d(point.x, point.y, scaledWeights[index]));
    
    const xs = allPoints.map(point => point.x);
    const ys = allPoints.map(point => point.y);
    const range = Range2d.createXYXY(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
    range.expandInPlace(0.1);
    
    // Filter out any undefined values from allPoints
    //const validPoints = allPoints.filter(Boolean);
    //const xs = validPoints.map(point => point.x);
    //const ys = validPoints.map(point => point.y);
    //const range = Range2d.createXYXY(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
    //range.expandInPlace(0.1)
    //heatmapDecorator.current.setPoints(allPoints);
    heatmapDecorator.current.setPoints(allPoints);
    heatmapDecorator.current.setSpreadFactor(0.2); // Adjust as needed

    heatmapDecorator.current.setHeight(0)
    heatmapDecorator.current.setRange(range);
    HeatmapDecoratorApi.enableDecorations(heatmapDecorator.current);
    setIsHeatmapDisplayed(true);
  };

  useEffect(() => {
 
    _loadMongoData();
  }, [selectedIssueType,viewInit, viewport, heatmapDecorator]);

  const handleIssueTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedIssueType(event.target.value as IssueType);
  };

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
       <select value={selectedIssueType} onChange={handleIssueTypeChange}>
        <option value="all">All Issues</option>
        <option value="flood">Flood</option>
        <option value="road">Road</option>
        <option value="lightening">Lightening</option>
        <option value="maintenance">Maintenance</option>    
        <option value="noise">Noise</option>
        <option value="crime">Crime</option>   
        <option value="garbage">Garbage</option>
        <option value="other">Other</option>
        </select>

      <div className="sample-grid">
        <Alert type="informational" className="no-icon">
          Select the issue types that you want to see.
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

