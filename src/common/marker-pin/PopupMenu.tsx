import React from "react";
import { UiEvent } from "@itwin/appui-abstract";
import { ContextMenuItem, GlobalContextMenu } from "@itwin/core-react";

export interface PopupMenuProps {
  canvas: HTMLCanvasElement | undefined;
}

export interface PopupMenuEntry {
  label: string;
  onPicked: (entry: PopupMenuEntry) => void;
  photo?: File;
  description?: string;
  issueType?: string;
}

export interface PopupMenuState {
  menuVisible: boolean;
  menuX: number;
  menuY: number;
  entries?: PopupMenuEntry[];
}

export class PopupMenuEvent extends UiEvent<PopupMenuState> {}

export class PopupMenu extends React.Component<PopupMenuProps, PopupMenuState> {
  public readonly state: PopupMenuState = {
    menuVisible: false,
    menuX: 0,
    menuY: 0,
  };

  public static readonly onPopupMenuEvent = new PopupMenuEvent();

  public componentDidMount() {
    PopupMenu.onPopupMenuEvent.addListener(this._handlePopupMenuEvent);
  }

  public componentWillUnmount() {
    PopupMenu.onPopupMenuEvent.removeListener(this._handlePopupMenuEvent);
  }

  private _handlePopupMenuEvent = (state: PopupMenuState) => {
    this.setState(state);
  };

  private getOffset(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
    };
  }

  public render(): React.ReactNode {
    const { entries, menuX, menuY, menuVisible } = this.state;
    const onClose = this._hideContextMenu;
    const offset = this.props.canvas ? this.getOffset(this.props.canvas) : undefined;

    if (menuVisible) {
      const items = this.getMenuItems(entries);

      return (
        <GlobalContextMenu
          identifier="popup-menu"
          x={menuX + (offset ? offset.left : 0)}
          y={menuY + (offset ? offset.top : 0)}
          opened={menuVisible}
          onEsc={onClose}
          onOutsideClick={onClose}
          edgeLimit={false}
          autoflip={true}
        >
          {items}
        </GlobalContextMenu>
      );
    }

    return null;
  }

  private getMenuItems(entries?: PopupMenuEntry[]): React.ReactNode[] {
    const items: React.ReactNode[] = [];

    if (entries) {
      entries.forEach((entry: PopupMenuEntry, index: number) => {
        const item = this.getMenuItem(entry, index);
        if (item) items.push(item);
      });
    }

    return items;
  }

  private getMenuItem(entry: PopupMenuEntry, index: number): React.ReactNode {
    const sel = () => this._itemPicked(entry);
    const node = (
      <ContextMenuItem key={index} onSelect={sel}>
        {entry.label}
        {entry.description && <div>{entry.description}</div>}
        {entry.issueType && <div>{`Issue Type: ${entry.issueType}`}</div>}
        {entry.photo && <img src={URL.createObjectURL(entry.photo)} alt="Photo" style={{ width: "100px", height: "auto" }} />}
      </ContextMenuItem>
    );

    return node;
  }

  private _hideContextMenu = () => {
    this.setState({ menuVisible: false, entries: undefined });
  };

  private _itemPicked = (entry: PopupMenuEntry): void => {
    this._hideContextMenu();
    entry.onPicked(entry);
  };
}
