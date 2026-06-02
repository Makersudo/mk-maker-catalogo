import type { ProductVariant } from "../store/useProductStore";

export type VariationPresetId =
  | "clothing-size"
  | "shoe-size"
  | "pants-size"
  | "color"
  | "flavor"
  | "voltage"
  | "model"
  | "custom";

export interface VariationPreset {
  id: VariationPresetId;
  label: string;
  optionName: string;
  placeholderValue: string;
  placeholderLabel: string;
  values: string[];
}

export const VARIATION_PRESETS: VariationPreset[] = [
  {
    id: "clothing-size",
    label: "Tamanho",
    optionName: "Tamanho",
    placeholderValue: "M",
    placeholderLabel: "Tamanho: M",
    values: ["Mini", "P", "M", "G", "Kit", "Refil"],
  },
  {
    id: "shoe-size",
    label: "Tonalidade",
    optionName: "Tonalidade",
    placeholderValue: "Nude",
    placeholderLabel: "Tonalidade: Nude",
    values: ["Claro", "Medio", "Escuro", "Nude", "Rose", "Vermelho"],
  },
  {
    id: "pants-size",
    label: "Acabamento",
    optionName: "Acabamento",
    placeholderValue: "Matte",
    placeholderLabel: "Acabamento: Matte",
    values: ["Matte", "Glow", "Cremoso", "Cintilante", "Glitter", "Translucido"],
  },
  {
    id: "color",
    label: "Cor",
    optionName: "Cor",
    placeholderValue: "Preto",
    placeholderLabel: "Cor: Preto",
    values: ["Preto", "Branco", "Nude", "Rosa", "Rose", "Marrom"],
  },
  {
    id: "flavor",
    label: "Linha",
    optionName: "Linha",
    placeholderValue: "Profissional",
    placeholderLabel: "Linha: Profissional",
    values: ["Basica", "Premium", "Profissional", "Artistica"],
  },
  {
    id: "voltage",
    label: "Volume",
    optionName: "Volume",
    placeholderValue: "10ml",
    placeholderLabel: "Volume: 10ml",
    values: ["5ml", "10ml", "30ml", "50ml", "100ml", "200ml"],
  },
  {
    id: "model",
    label: "Modelo",
    optionName: "Modelo",
    placeholderValue: "Premium",
    placeholderLabel: "Modelo: Premium",
    values: ["Basico", "Premium", "Pro"],
  },
  {
    id: "custom",
    label: "Personalizado",
    optionName: "Tipo",
    placeholderValue: "Valor",
    placeholderLabel: "Tipo: Valor",
    values: [],
  },
];

export function getVariationPreset(id: VariationPresetId) {
  return VARIATION_PRESETS.find((preset) => preset.id === id) ?? VARIATION_PRESETS[0];
}

export function inferPresetIdFromVariants(variants: ProductVariant[] | undefined): VariationPresetId {
  const firstOptionName = variants?.find((variant) => variant.options?.[0]?.name)?.options[0]?.name?.toLowerCase() ?? "";

  if (firstOptionName.includes("tonalidade") || firstOptionName.includes("tom")) return "shoe-size";
  if (firstOptionName.includes("acabamento")) return "pants-size";
  if (firstOptionName.includes("cor")) return "color";
  if (firstOptionName.includes("linha")) return "flavor";
  if (firstOptionName.includes("volume") || firstOptionName.includes("ml")) return "voltage";
  if (firstOptionName.includes("modelo")) return "model";
  if (firstOptionName.includes("tamanho")) return "clothing-size";

  return "shoe-size";
}

export function createVariantFromPreset(presetId: VariationPresetId, value = ""): ProductVariant {
  const preset = getVariationPreset(presetId);
  const optionValue = value.trim();
  const optionName = preset.optionName;

  return {
    label: optionValue ? `${optionName}: ${optionValue}` : "",
    sku: "",
    options: [{ name: optionName, value: optionValue }],
    price: null,
    stockQuantity: 0,
    isActive: true,
  };
}
