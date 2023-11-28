/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import React from "react";
import { Point3d, Range2d } from "@itwin/core-geometry";
import { Label, LabeledSelect, SelectOption, Slider } from "@itwin/itwinui-react";
import { BasePointGenerator, CirclePointGenerator, CrossPointGenerator, RandomPointGenerator } from "./PointGenerators";

export enum PointMode {
  Random = "1",
  Circle = "2",
  Cross = "3",
}

const pointModeOptions: SelectOption<PointMode>[] = [
  { value: PointMode.Random, label: "Random" },
  { value: PointMode.Circle, label: "Circle" },
  { value: PointMode.Cross, label: "Cross" },
];

/** React state of the PointSelector component */
export interface PointSelectorProps {
  onPointsChanged(points: Point3d[]): void;
  range?: Range2d;
}

/** React state of the PointSelector */
export interface PointSelectorState {
  pointMode: PointMode;
  pointGenerator: BasePointGenerator;
  pointCount: number;
}

/** A component that renders a point mode selector and a point count range input. */
export class PointSelector extends React.Component<PointSelectorProps, PointSelectorState> {

  /** Creates a PointSelector instance */
  constructor(props?: any) {
    super(props);
    this.state = {
      pointMode: pointModeOptions[0].value,
      pointGenerator: new RandomPointGenerator(),
      pointCount: 10,
    };
  }

  public getPoints(): Point3d[] {
    if (undefined === this.props.range)
      return [];

    return this.state.pointGenerator.generatePoints(this.state.pointCount, this.props.range);
  }

  private notifyChange(): void {
    if (undefined === this.props.range)
      return;

    this.props.onPointsChanged(this.getPoints());
  }

  private _onChangePointMode = (pointMode: PointMode) => {
    let pointGenerator: BasePointGenerator;

    switch (pointMode) {
      case PointMode.Circle: { pointGenerator = new CirclePointGenerator(); break; }
      case PointMode.Cross: { pointGenerator = new CrossPointGenerator(); break; }
      default:
      case PointMode.Random: { pointGenerator = new RandomPointGenerator(); break; }
    }

    this.setState({ pointGenerator, pointMode });
  };

  private _onChangePointCount = (values: readonly number[]) => {
    this.setState({ pointCount: values[0] });
  };

  public componentDidMount() {
    this.notifyChange();
  }

  public componentDidUpdate(prevProps: PointSelectorProps, prevState: PointSelectorState) {
    if (undefined !== this.props.range && (this.props.range !== prevProps.range ||
      prevState.pointCount !== this.state.pointCount ||
      prevState.pointGenerator !== this.state.pointGenerator)) {
      this.notifyChange();
    }
  }

  /** The component's render method */
  public render() {
    return (
      <>
        <LabeledSelect label="Points" size="small" value={this.state.pointMode} onChange={this._onChangePointMode} options={pointModeOptions} />
        <div>
          <Label htmlFor="point-cloud-slider">Point Count</Label>
          <Slider id="point-cloud-slider" min={0} max={500} values={[this.state.pointCount]} step={1} onChange={this._onChangePointCount} onUpdate={this._onChangePointCount} />
        </div>
      </>
    );
  }
}
