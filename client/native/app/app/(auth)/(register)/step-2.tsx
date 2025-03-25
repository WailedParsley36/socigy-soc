import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

import LoadingScreen from "@/components/LoadingScreen";
import protectRoute from "@/lib/protectRoute";
import { Sex } from "@/lib/structures/Enums";
import useAwaitedAuthStore from "@/stores/AuthStore";

export default function Step2() {
  const { isLoaded, auth } = useAwaitedAuthStore();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSex, setSelectedSex] = useState(Sex.PreferNotToSay.toString());

  const router = useRouter();

  const handleFormSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(undefined);

    try {
      const result = await auth.submitRegistrationStep2(
        birthDate,
        parseInt(selectedSex)
      );

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (result.result) {
        router.push("/(auth)/(register)/parent-link");
      } else {
        router.push("/(auth)/(register)/step-3");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [auth, router, birthDate, selectedSex]);

  const onChangeBirthDate = (event: any, selectedDate: any) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === "ios");
    setBirthDate(currentDate);
  };

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  const redirectTo = protectRoute(auth, {
    allowNonRegistered: true,
    onlyNonRegistered: true,
    allowNonVerified: false,
  });
  if (redirectTo) return redirectTo;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            padding: 32,
            borderRadius: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Let's finish creating your account
          </Text>
          <Text
            style={{ textAlign: "center", color: "#4B5563", marginBottom: 24 }}
          >
            Before we let you in, we need to know more things about you. Don't
            worry you can change these later
          </Text>

          {error && (
            <View
              style={{
                backgroundColor: "#FEE2E2",
                borderLeftWidth: 4,
                borderLeftColor: "#EF4444",
                padding: 16,
                borderRadius: 4,
                marginBottom: 24,
              }}
            >
              <Text style={{ color: "#B91C1C" }}>{error}</Text>
            </View>
          )}

          <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 4 }}>
            Date of Birth
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 4,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text>{birthDate.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={birthDate}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={onChangeBirthDate}
            />
          )}

          <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 4 }}>
            Sex
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 4,
              marginBottom: 4,
            }}
          >
            <Picker
              selectedValue={selectedSex}
              onValueChange={(itemValue) => setSelectedSex(itemValue)}
            >
              <Picker.Item
                label="Prefer not to say"
                value={Sex.PreferNotToSay.toString()}
              />
              <Picker.Item label="Male" value={Sex.Male.toString()} />
              <Picker.Item label="Female" value={Sex.Female.toString()} />
              <Picker.Item label="Other" value={Sex.Other.toString()} />
            </Picker>
          </View>
          <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 24 }}>
            This will not be shared with others, unless you enable it in the{" "}
            <Text style={{ fontWeight: "bold" }}>Privacy Settings</Text>
          </Text>

          <TouchableOpacity
            onPress={handleFormSubmit}
            disabled={isSubmitting}
            style={{
              backgroundColor: isSubmitting ? "#60A5FA" : "#2563EB",
              padding: 12,
              borderRadius: 4,
              alignItems: "center",
            }}
          >
            {isSubmitting ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator
                  size="small"
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: "white", fontWeight: "500" }}>
                  Processing...
                </Text>
              </View>
            ) : (
              <Text style={{ color: "white", fontWeight: "500" }}>
                Continue →
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
