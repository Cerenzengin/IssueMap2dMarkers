/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
    BingLocationProvider,
    IModelApp,
    IModelConnection,
    queryTerrainElevationOffset,
    ScreenViewport,
    SpatialViewState,
    Viewport
  } from "@itwin/core-frontend";

  import { Range3d, Transform, Vector2d } from "@itwin/core-geometry";
  import {
    BackgroundMapType,
    DisplayStyle3dProps,
    GlobeMode,
    SpatialViewDefinitionProps
  } from "@itwin/core-common";
  export default class CarDecorationApi {
    /** Will be updated to dispose the currently active decorator. */
    private static _disposables: VoidFunction[] = [];
  
 
    /** Used by `travelTo` to find a destination given a name */
    private static _locationProvider?: BingLocationProvider;
  
    /** Used to determine how far out to search - this is in meters and is slightly less than 50 miles */
    public static readonly maxQueryDistance = 50000;
  
    /** Provides conversion from a place name to a location on the Earth's surface. */
    public static get locationProvider(): BingLocationProvider {
      return (
        this._locationProvider ||
        (this._locationProvider = new BingLocationProvider())
      );
    }
  
    /** Given a place name - whether a specific address or a more freeform description like "New Zealand", "Ol' Faithful", etc -
     * look up its location on the Earth and, if found, use a flyover animation to make the viewport display that location.
     */
    public static async travelTo(
      viewport: ScreenViewport,
      destination: string
    ): Promise<boolean> {
      if (!viewport.view.is3d()) return false;
  
      // Obtain latitude and longitude.
      const location = await this.locationProvider.getLocation(destination);
      if (!location) return false;
  
      // Determine the height of the Earth's surface at this location.
      const elevationOffset = await queryTerrainElevationOffset(
        viewport,
        location.center
      );
      if (elevationOffset !== undefined) location.center.height = elevationOffset;
  
      // Move the viewport to the location.
      let viewArea: Range3d;
      if (location.area) {
        const northeastPoint = viewport.view.cartographicToRoot(
          location.area.northeast
        );
        const southwestPoint = viewport.view.cartographicToRoot(
          location.area.southwest
        );
  
        if (!northeastPoint || !southwestPoint) return false;
  
        viewArea = Range3d.create(northeastPoint, southwestPoint);
      } else {
        // area doesn't exist so create view bounds with a radius of 100 meters
        const center = viewport.view.cartographicToRoot(location.center);
        if (!center) return false;
  
        let transformation = Transform.createTranslationXYZ(100, 100, 100);
        const corner1 = transformation.multiplyPoint3d(center);
        transformation = Transform.createTranslationXYZ(-100, -100, -100);
        const corner2 = transformation.multiplyPoint3d(center);
  
        viewArea = Range3d.create(corner1, corner2);
      }
  
      viewport.zoomToVolume(viewArea);
      return true;
    }
  
    /** Changes the background map between using open street map street view and bing hybrid view */
    public static setMap(viewport: Viewport, streetsOnlyMap: boolean) {
      if (!viewport.view.is3d()) return;
  
      const displayStyle = viewport.view.getDisplayStyle3d();
  
      if (streetsOnlyMap) {
  
        displayStyle.changeBackgroundMapProvider({
          name: "BingProvider",
          type: BackgroundMapType.Hybrid,
        });
      }
    }
  
    /** Returns the 2d magnitude of the viewport's extents */
    public static getExtents(viewport: Viewport): number {
      return Vector2d.createFrom(viewport.view.getExtents()).magnitude();
    }
  
  
    /** Returns a spacial views state with the viewport's location set to Madrid */
    public static readonly getInitialView = async (
      imodel: IModelConnection
    ): Promise<SpatialViewState> => {
      // These values come from the view definition associated with this iModel
      const model = "0x20000000020";
      const viewDefinitionId = "0x200000008c9";
      const categorySelectorId = "0x200000008cc";
      const displayStyleId = "0x200000008cb";
      const modelSelectorId = "0x200000008ca";
  
      const viewDefinitionProps: SpatialViewDefinitionProps = {
        classFullName: "BisCore:SpatialViewDefinition",
        id: viewDefinitionId,
        jsonProperties: {
          viewDetails: {
            gridOrient: 4,
            gridSpaceX: 0.1,
            disable3dManipulations: true,
          },
        },
        code: {
          spec: "0x1c",
          scope: model,
          value: "3D Metric Design - View 1",
        },
        model,
        categorySelectorId,
        displayStyleId,
        isPrivate: false,
        description: "",
        cameraOn: false,
        origin: [-11941629.925858043, 4777112.235469295, 44102.77093490586],
        extents: [1312.179818775386, 2143.3449330940266, 1410.4581301882986],
        angles: {},
        camera: {
          lens: 0,
          focusDist: 0,
          eye: [0, 0, 0],
        },
        modelSelectorId,
      };
  
      const displayStyleProps: DisplayStyle3dProps = {
        classFullName: "BisCore:DisplayStyle3d",
        code: { scope: model, spec: "0xa", value: "" },
        id: displayStyleId,
        model,
        jsonProperties: {
          styles: {
            backgroundMap: {
              globeMode: GlobeMode.Plane,
              nonLocatable: true,
            },
            viewflags: {
              backgroundMap: true,
              grid: false,
            },
          },
        },
      };
  
      return SpatialViewState.createFromProps(
        {
          viewDefinitionProps,
          displayStyleProps,
          categorySelectorProps: {
            categories: [],
            classFullName: "BisCore:CategorySelector",
            code: { scope: model, spec: "0x8", value: "" },
            id: categorySelectorId,
            model,
          },
          modelSelectorProps: {
            classFullName: "BisCore:ModelSelector",
            code: { scope: model, spec: "0x11", value: "" },
            id: modelSelectorId,
            model,
            models: [],
          },
        },
        imodel
      );
    };
  }
  