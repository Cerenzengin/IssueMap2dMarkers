
import { BingLocationProvider, IModelApp,  IModelConnection, queryTerrainElevationOffset
  ,ScreenViewport,SpatialViewState, Viewport, 
  } from "@itwin/core-frontend";
import { Range3d, Transform } from "@itwin/core-geometry";
import {
  BackgroundMapType,
  BaseMapLayerSettings,
  DisplayStyle3dProps,
  GlobeMode,
  SpatialViewDefinitionProps
} from "@itwin/core-common";

export default class GeoLocationApi {

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
      displayStyle.backgroundMapBase = BaseMapLayerSettings.fromJSON({
        formatId: "TileURL",
        url: "https://b.tile.openstreetmap.org/{level}/{column}/{row}.png",
        name: "openstreetmap",
      });
    } else {
      displayStyle.changeBackgroundMapProvider({
        name: "BingProvider",
        type: BackgroundMapType.Hybrid,
      });
    }
  }



}