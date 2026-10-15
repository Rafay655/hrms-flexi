import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  INITIAL_SCHEMA,
  STEP_ICONS,
  uid,
  type ComplianceTag,
  type Field,
  type FieldType,
  type Step,
} from "@/lib/onboarding-schema";

type OnboardingState = {
  schema: Step[];
  activeStepIndex: number;
  editingFieldId: string | null;
  quickStep: number;
  detailedStep: number;
};

const initialState: OnboardingState = {
  schema: INITIAL_SCHEMA,
  activeStepIndex: 0,
  editingFieldId: null,
  quickStep: 0,
  detailedStep: 0,
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setActiveStepIndex(state, action: PayloadAction<number>) {
      state.activeStepIndex = action.payload;
      state.editingFieldId = null;
    },

    setEditingFieldId(state, action: PayloadAction<string | null>) {
      state.editingFieldId = action.payload;
    },

    setQuickStep(state, action: PayloadAction<number>) {
      state.quickStep = action.payload;
    },

    setDetailedStep(state, action: PayloadAction<number>) {
      state.detailedStep = action.payload;
    },

    updateStepTitle(
      state,
      action: PayloadAction<{ stepIndex: number; title: string }>
    ) {
      state.schema[action.payload.stepIndex].title = action.payload.title;
    },

    addStep(state) {
      state.schema.push({
        id: uid("step"),
        title: "New Step",
        icon: STEP_ICONS[state.schema.length % STEP_ICONS.length],
        desc: "Step description",
        fields: [],
      });
      state.activeStepIndex = state.schema.length - 1;
      state.editingFieldId = null;
    },

    deleteStep(state) {
      if (state.schema.length <= 1) return;

      state.schema.splice(state.activeStepIndex, 1);
      state.activeStepIndex = Math.max(0, state.activeStepIndex - 1);
      state.editingFieldId = null;
    },

    addField(state) {
      const field: Field = {
        id: uid("field"),
        label: "New Field",
        key: `field_${Math.random().toString(36).slice(2, 5)}`,
        type: "text",
        ph: "",
        req: false,
        disabled: false,
        tags: [],
        span: 1,
        q: true,
        d: true,
      };

      state.schema[state.activeStepIndex].fields.push(field);
      state.editingFieldId = field.id;
    },

    updateField(
      state,
      action: PayloadAction<{ fieldId: string; patch: Partial<Field> }>
    ) {
      state.schema.forEach((step) => {
        const field = step.fields.find((item) => item.id === action.payload.fieldId);
        if (field) Object.assign(field, action.payload.patch);
      });
    },

    deleteField(state, action: PayloadAction<string>) {
      state.schema.forEach((step) => {
        step.fields = step.fields.filter((field) => field.id !== action.payload);
      });

      if (state.editingFieldId === action.payload) {
        state.editingFieldId = null;
      }
    },

    toggleFieldTag(
      state,
      action: PayloadAction<{ fieldId: string; tag: ComplianceTag }>
    ) {
      state.schema.forEach((step) => {
        const field = step.fields.find((item) => item.id === action.payload.fieldId);
        if (!field) return;

        if (field.tags.includes(action.payload.tag)) {
          field.tags = field.tags.filter((tag) => tag !== action.payload.tag);
        } else {
          field.tags.push(action.payload.tag);
        }
      });
    },

    moveFieldToStep(
      state,
      action: PayloadAction<{
        fieldId: string;
        fromStepIndex: number;
        toStepIndex: number;
      }>
    ) {
      const { fieldId, fromStepIndex, toStepIndex } = action.payload;
      if (fromStepIndex === toStepIndex) return;

      const fromStep = state.schema[fromStepIndex];
      const fieldIndex = fromStep.fields.findIndex((field) => field.id === fieldId);
      if (fieldIndex === -1) return;

      const [field] = fromStep.fields.splice(fieldIndex, 1);
      state.schema[toStepIndex].fields.push(field);
      state.editingFieldId = null;
    },

    /* ───── Form Builder ↔ Onboard X wiring ───── */

    updateFieldProperty(
      state,
      action: PayloadAction<{
        stepId: string;
        fieldId: string;
        property: keyof Field;
        value: any;
      }>
    ) {
      const step = state.schema.find((s) => s.id === action.payload.stepId);
      if (!step) return;
      const field = step.fields.find((f) => f.id === action.payload.fieldId);
      if (!field) return;
      (field as any)[action.payload.property] = action.payload.value;
    },

    reorderFields(
      state,
      action: PayloadAction<{ stepId: string; newOrder: string[] }>
    ) {
      const step = state.schema.find((s) => s.id === action.payload.stepId);
      if (!step) return;
      step.fields = action.payload.newOrder
        .map((id) => step.fields.find((f) => f.id === id))
        .filter(Boolean) as Field[];
    },

    reorderSteps(state, action: PayloadAction<string[]>) {
      const newSchema = action.payload
        .map((id) => state.schema.find((s) => s.id === id))
        .filter(Boolean) as Step[];
      state.schema = newSchema;
    },

    addFieldToStep(
      state,
      action: PayloadAction<{ stepId: string; field: Field }>
    ) {
      const step = state.schema.find((s) => s.id === action.payload.stepId);
      if (step) step.fields.push(action.payload.field);
    },

    removeField(
      state,
      action: PayloadAction<{ stepId: string; fieldId: string }>
    ) {
      const step = state.schema.find((s) => s.id === action.payload.stepId);
      if (step) {
        step.fields = step.fields.filter((f) => f.id !== action.payload.fieldId);
      }
      if (state.editingFieldId === action.payload.fieldId) {
        state.editingFieldId = null;
      }
    },

    addStepToSchema(state, action: PayloadAction<Step>) {
      state.schema.push(action.payload);
    },

    resetSchema(state) {
      state.schema = INITIAL_SCHEMA;
      state.activeStepIndex = 0;
      state.editingFieldId = null;
      state.quickStep = 0;
      state.detailedStep = 0;
    },
  },
});

export const {
  setActiveStepIndex,
  setEditingFieldId,
  setQuickStep,
  setDetailedStep,
  updateStepTitle,
  addStep,
  deleteStep,
  addField,
  updateField,
  deleteField,
  toggleFieldTag,
  moveFieldToStep,
  updateFieldProperty,
  reorderFields,
  reorderSteps,
  addFieldToStep,
  removeField,
  addStepToSchema,
  resetSchema,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
export type { FieldType };