import type { UnitTypeId } from "./types";

export const UNIT_SPRITE_CLASSES: Record<UnitTypeId, string> = {
  swordsman: "swordsmanSprite",
  dual_swordsman: "doubleSwordSprite",
  magic_swordsman: "magicSwordSprite",
  fire_mage: "fireMagicianSprite",
  ice_mage: "iceMagicianSprite",
  lightning_mage: "thunderMagicianSprite",
  rifleman: "riflemanSprite",
  shotgunner: "shotgunnerSprite",
  sniper: "sniperSprite",
};

export const UNIT_EFFECT_CLASSES: Record<UnitTypeId, string> = {
  swordsman: "swordsmanEffect",
  dual_swordsman: "doubleSwordEffect",
  magic_swordsman: "magicSwordEffect",
  fire_mage: "fireMagicianEffect",
  ice_mage: "iceMagicianEffect",
  lightning_mage: "thunderMagicianEffect",
  rifleman: "riflemanEffect",
  shotgunner: "shotgunnerEffect",
  sniper: "sniperEffect",
};

export const UNIT_PORTRAIT_CLASSES: Record<UnitTypeId, string> = {
  swordsman: "swordsmanPortrait",
  dual_swordsman: "doubleSwordPortrait",
  magic_swordsman: "magicSwordPortrait",
  fire_mage: "fireMagicianPortrait",
  ice_mage: "iceMagicianPortrait",
  lightning_mage: "thunderMagicianPortrait",
  rifleman: "riflemanPortrait",
  shotgunner: "shotgunnerPortrait",
  sniper: "sniperPortrait",
};
