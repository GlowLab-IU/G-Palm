import { Controller } from "react-hook-form";
import { FormControl, Input } from "native-base";

type Props<T> = {
  name: keyof T & string;
  control: any;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  rules?: any;
  keyboardType?: any;
};

export function FormInput<T>({
  name,
  control,
  label,
  placeholder,
  secureTextEntry,
  rules,
  keyboardType,
}: Props<T>) {
  return (
    <FormControl className="mb-3">
      <FormControl.Label>{label}</FormControl.Label>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <>
            <Input
              onBlur={onBlur}
              onChangeText={onChange}
              value={value?.toString?.() ?? value}
              placeholder={placeholder}
              secureTextEntry={secureTextEntry}
              keyboardType={keyboardType}
            />
            {error ? (
              <FormControl.ErrorMessage>
                {error.message}
              </FormControl.ErrorMessage>
            ) : null}
          </>
        )}
      />
    </FormControl>
  );
}
