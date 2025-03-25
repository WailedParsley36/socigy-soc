import AppBackgroundBase from "@/components/background/AppBackgroundBase";
import { Colors, Theme } from "@/constants/Colors";
import {
  useAuth,
  useUiComponent,
  useUiRegistry,
  useUserManager,
} from "@/managers/Exports";
import { RelationshipState, UserRelationship } from "@/managers/user/Exports";
import Feather from "@expo/vector-icons/Feather";
import React, { useCallback, useEffect, useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";
import { FlatList, ScrollView } from "react-native-gesture-handler";
import { Image } from "expo-image";

export default function Profile() {
  // Hooks
  const userManager = useUserManager();
  const auth = useAuth();

  // States
  const [incomingRelationships, setIncomingRelationships] = useState<
    UserRelationship[]
  >([]);
  const [relationships, setRelationships] = useState<UserRelationship[]>([]);

  // Callbacks
  const handleIncommingRelationshipEnd = useCallback(
    async (e?: any, removeAll: boolean = false) => {
      const result = await userManager.getIncomingRelationships(
        10,
        incomingRelationships.length
      );
      if (result.error) {
        console.error(result.error);
        return;
      }

      // End reached
      if (e && !removeAll)
        setIncomingRelationships([...incomingRelationships, ...result.result!]);
      else setIncomingRelationships([...result.result!]);
    },
    [incomingRelationships, setIncomingRelationships]
  );

  const handleRelationshipEnd = useCallback(
    async (e?: any, removeAll: boolean = false) => {
      const result = await userManager.getAllRelationships(
        10,
        relationships.length
      );
      if (result.error) {
        console.error(result.error);
        return;
      }

      // End reached
      if (e && !removeAll)
        setRelationships([...relationships, ...result.result!]);
      else setRelationships([...result.result!]);
    },
    [relationships, setRelationships]
  );

  const handleRelationshipRejectOrRemoveCloseFriend = useCallback(
    async (
      x: UserRelationship,
      incoming: boolean = true,
      closeFriend: boolean = false
    ) => {
      const result = incoming
        ? await userManager.rejectIncomingRelationshipByUsername(
            x.username,
            x.tag
          )
        : closeFriend
        ? await userManager.removeCloseFriendByUsername(x.username, x.tag)
        : await userManager.removeFriendByUsername(x.username, x.tag);

      if (result != null) return;

      if (incoming) {
        setIncomingRelationships((prev) =>
          prev.filter((y) => y.username != x.username && y.tag != x.tag)
        );
        handleRelationshipEnd(undefined, true);
      } else
        setRelationships((prev) =>
          prev.filter((y) => y.username != x.username && y.tag != x.tag)
        );
    },
    [userManager]
  );

  const handleRelationshipAcceptOrCloseFriends = useCallback(
    async (x: UserRelationship, incoming: boolean = true) => {
      const result = incoming
        ? await userManager.acceptIncomingRelationshipByUsername(
            x.username,
            x.tag
          )
        : await userManager.addCloseFriendByUsername(x.username, x.tag);
      if (result != null) return;

      if (incoming) {
        setIncomingRelationships((prev) =>
          prev.filter((y) => y.username != x.username && y.tag != x.tag)
        );
        handleRelationshipEnd(undefined, true);
      } else
        setRelationships((prev) =>
          prev.filter((y) => y.username != x.username && y.tag != x.tag)
        );
    },
    [userManager]
  );

  const handleTokensRefresh = useCallback(async () => {
    await auth.manager.refreshTokens(true);
  }, [auth]);

  const handleUserLogout = useCallback(async () => {
    await auth.manager.logOutAsync();
  }, [auth]);

  // Effects
  useEffect(() => {
    handleIncommingRelationshipEnd();
    handleRelationshipEnd();
  }, []);

  const [renderProp, setRenderProp] = useState(true);

  return (
    <AppBackgroundBase
      className="px-10 pt-10"
      canScroll
      additionalScrollViewProps={{ contentContainerClassName: "flex-1 pb-40" }}
    >
      <Text className="text-text-primary">Profile</Text>
      {incomingRelationships && incomingRelationships.length > 0 && (
        <View className="mb-5">
          <Text className="text-text-primary font-inter-semibold text-lg mb-4">
            Incoming relationship requests
          </Text>
          <FlatList
            scrollEnabled={false}
            data={incomingRelationships!}
            contentContainerClassName="gap-y-3"
            onEndReached={handleIncommingRelationshipEnd}
            keyExtractor={(x) => x.username + x.tag}
            renderItem={(x) => {
              let request =
                (x.item.state & RelationshipState.Friends) ==
                RelationshipState.Friends
                  ? "Friend"
                  : "";
              request +=
                (x.item.state & RelationshipState.Follower) ==
                RelationshipState.Follower
                  ? request.length > 0
                    ? " + Follow"
                    : "Follow"
                  : "";

              return (
                <View>
                  <View className="flex flex-row items-center gap-x-4">
                    {x.item.iconUrl ? (
                      <Image
                        source={{ uri: x.item.iconUrl }}
                        className="my-auto mr-4"
                        style={{ height: 40, width: 40 }}
                      />
                    ) : (
                      <Feather
                        name="user"
                        size={40}
                        color={Colors[Theme]["text-primary"]}
                      />
                    )}
                    <View>
                      <Text className="text-text-third">{x.item.tag}</Text>
                      <Text className="text-text-primary">
                        {x.item.username}
                      </Text>
                    </View>
                    <Text className="text-text-primary font-inter-bold">
                      {request} request
                    </Text>
                  </View>
                  <View className="flex flex-row gap-x-4">
                    <Button
                      title="Reject"
                      color={"red"}
                      onPress={() =>
                        handleRelationshipRejectOrRemoveCloseFriend(x.item)
                      }
                    />
                    <Button
                      title="Accept"
                      color={"green"}
                      onPress={() =>
                        handleRelationshipAcceptOrCloseFriends(x.item)
                      }
                    />
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}
      <Button
        title="Get incoming relationships"
        onPress={() => handleIncommingRelationshipEnd()}
      />

      {relationships && relationships.length > 0 && (
        <View className="mt-5">
          <Text className="text-text-primary font-inter-semibold text-lg mb-4">
            Your Relationships
          </Text>
          <FlatList
            scrollEnabled={false}
            data={relationships!}
            contentContainerClassName="gap-y-3"
            onEndReached={handleRelationshipEnd}
            keyExtractor={(x) => x.username + x.tag}
            renderItem={(x) => {
              const isCloseFriend =
                (x.item.state & RelationshipState.CloseFriends) ==
                RelationshipState.CloseFriends;
              let request = isCloseFriend
                ? "Close Friends"
                : (x.item.state & RelationshipState.Friends) ==
                  RelationshipState.Friends
                ? "Friend"
                : "";
              request +=
                (x.item.state & RelationshipState.Follower) ==
                RelationshipState.Follower
                  ? request.length > 0
                    ? " + Follower"
                    : "Follower"
                  : "";
              console.log("RELATIONSHIP STATE", x.item.state);

              return (
                <View>
                  <View className="flex flex-row items-center gap-x-4">
                    {x.item.iconUrl ? (
                      <Image
                        source={{ uri: x.item.iconUrl }}
                        className="my-auto mr-4"
                        style={{ height: 40, width: 40 }}
                      />
                    ) : (
                      <Feather
                        name="user"
                        size={40}
                        color={Colors[Theme]["text-primary"]}
                      />
                    )}
                    <View>
                      <Text className="text-text-third">{x.item.tag}</Text>
                      <Text className="text-text-primary">
                        {x.item.username}
                      </Text>
                    </View>
                    <Text className="text-text-primary font-inter-bold">
                      {request}
                    </Text>
                  </View>
                  <View className="flex flex-row gap-x-4 w-full">
                    <Button
                      title="Unfriend"
                      color={"red"}
                      onPress={() =>
                        handleRelationshipRejectOrRemoveCloseFriend(
                          x.item,
                          false
                        )
                      }
                    />
                    {isCloseFriend ? (
                      <Button
                        title="Remove from Close Friends"
                        color={"red"}
                        onPress={() =>
                          handleRelationshipRejectOrRemoveCloseFriend(
                            x.item,
                            false,
                            true
                          )
                        }
                      />
                    ) : (
                      <Button
                        title="Add to Close Friends"
                        color={"green"}
                        onPress={() =>
                          handleRelationshipAcceptOrCloseFriends(x.item, false)
                        }
                      />
                    )}
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}
      <Button
        title="Get your relationships"
        onPress={() => handleRelationshipEnd()}
      />

      <View className="mt-6 gap-y-4">
        <TouchableOpacity
          activeOpacity={0.75}
          className="bg-bg-ultraslim border border-bg-slim px-5 py-3 rounded-md"
          onPress={handleTokensRefresh}
        >
          <Text className="text-text-primary text-center">Refresh tokens</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          className="bg-bg-ultraslim border border-bg-slim px-5 py-3 rounded-md"
          onPress={handleUserLogout}
        >
          <Text className="text-text-primary text-center">Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="bg-foreground">
        <TestProfileComponent
          className="flex justify-center items-center mt-24"
          renderString={renderProp}
          content="Nazdar"
          imageUrl="https://socigy.com/favicon/favicon.svg"
        >
          {/* <Text className="text-foreground">This is passed as children</Text>
        <Text className="text-foreground">This is passed as children</Text> */}
        </TestProfileComponent>
      </ScrollView>
      <Button
        title="JUST DO IT!"
        onPress={() => setRenderProp((prev) => !prev)}
      />
    </AppBackgroundBase>
  );
}

// 6396e8ae-6ff9-4676-93a9-f1fb8f140e8d
export function TestProfileComponent(props: any) {
  const uiRegistry = useUiRegistry();
  return useUiComponent(
    uiRegistry,
    uiRegistry.getRegisteredComponents()[0][0],
    props,
    TestProfileComponentInternal
  );
}

export function TestProfileComponentInternal(props: any) {
  return (
    <View className={props.className}>
      <Text className="text-foreground">This is the default UI</Text>
      {props.children}
    </View>
  );
}

export function DefaultSocigyElement(props: any) {
  const uiRegistry = useUiRegistry();
  return useUiComponent(
    uiRegistry,
    "8d11e7ab-92d2-4157-bcba-b368921146e5",
    props
  );
}

export function DefaultSocigyElementInternal({
  children,
  className,
  ...rest
}: any) {
  return (
    <View className={className}>
      <Text className="text-red-500">
        This is the default UI with External Plugin Children
      </Text>
      {children}
      <Text className="text-red-500">Here ends the default UI</Text>
    </View>
  );
}
