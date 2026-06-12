export const AssetKeys = {
  TILES: {
    FLOOR: 'tile_floor',
    WALL: 'tile_wall',
    SHELF_BASE: 'tile_shelf_base',
  },
  PLAYER: {
    SHEET: 'player_sheet',
    WALK_N: 'player_walk_n',
    WALK_NE: 'player_walk_ne',
    WALK_E: 'player_walk_e',
    WALK_SE: 'player_walk_se',
    WALK_S: 'player_walk_s',
    WALK_SW: 'player_walk_sw',
    WALK_W: 'player_walk_w',
    WALK_NW: 'player_walk_nw',
    IDLE: 'player_idle',
    CARRY: 'player_carry',
  },
  FORKLIFT: {
    SHEET: 'forklift_sheet',
    IDLE: 'forklift_idle',
    MOVE: 'forklift_move',
  },
  BOXES: {
    LAGER: 'box_lager',
    ALE: 'box_ale',
    STOUT: 'box_stout',
    PILSNER: 'box_pilsner',
  },
  UI: {
    PANEL: 'ui_panel',
    TIMER_BG: 'ui_timer_bg',
  },
} as const;
