import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Plus, FolderOpen, Trash2, Edit2, Check, X } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Props = NativeStackScreenProps<RootStackParamList, "ManageCategories">;

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  isCustom: boolean;
}

export default function ManageCategoriesScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response: any = await api.get("/api/categories");
      return response.categories || [];
    },
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return await api.post("/api/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setShowAddForm(false);
      setNewCategoryName("");
      setNewCategoryDesc("");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to create category");
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description: string }) => {
      return await api.put(`/api/categories/${data.id}`, {
        name: data.name,
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingId(null);
      setEditName("");
      setEditDesc("");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to update category");
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to delete category");
    },
  });

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    createMutation.mutate({
      name: newCategoryName.trim(),
      description: newCategoryDesc.trim(),
    });
  };

  const handleUpdateCategory = (id: string) => {
    if (!editName.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    updateMutation.mutate({
      id,
      name: editName.trim(),
      description: editDesc.trim(),
    });
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDesc(category.description);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditDesc("");
  };

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      SALES: "#FF6B35",
      SOCIAL: "#00D9FF",
      ENTREPRENEURSHIP: "#7E3FE4",
      DATING: "#FF4081",
      CONFIDENCE: "#FFD700",
      CAREER: "#4CAF50",
      orange: "#FF6B35",
      blue: "#00D9FF",
      purple: "#7E3FE4",
      pink: "#FF4081",
      gold: "#FFD700",
      green: "#4CAF50",
    };
    return colors[color] || "#7E3FE4";
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(126, 63, 228, 0.2)",
            }}
          >
            <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white", flex: 1 }}>
              Manage Categories
            </Text>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Info Section */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                }}
              >
                <FolderOpen size={32} color="#7E3FE4" style={{ marginBottom: 12 }} />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: 8,
                  }}
                >
                  Custom Quest Categories
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "rgba(255, 255, 255, 0.7)",
                    lineHeight: 20,
                  }}
                >
                  Create custom categories for your quests. The AI will use these when generating
                  personalized challenges tailored to your goals.
                </Text>
              </View>
            </View>

            {/* Add Category Button */}
            {!showAddForm && (
              <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                <Pressable
                  onPress={() => setShowAddForm(true)}
                  style={{
                    backgroundColor: "rgba(255, 107, 53, 0.2)",
                    borderRadius: 16,
                    padding: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "rgba(255, 107, 53, 0.4)",
                  }}
                >
                  <Plus size={24} color="#FF6B35" />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#FF6B35",
                      marginLeft: 12,
                    }}
                  >
                    Add New Category
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Add Category Form */}
            {showAddForm && (
              <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: "rgba(255, 107, 53, 0.4)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: "white",
                      marginBottom: 16,
                    }}
                  >
                    New Category
                  </Text>

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "rgba(255, 255, 255, 0.8)",
                      marginBottom: 8,
                    }}
                  >
                    Category Name
                  </Text>
                  <TextInput
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="e.g., Public Speaking"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 12,
                      padding: 16,
                      color: "white",
                      fontSize: 16,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.1)",
                    }}
                  />

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "rgba(255, 255, 255, 0.8)",
                      marginBottom: 8,
                    }}
                  >
                    Description (Optional)
                  </Text>
                  <TextInput
                    value={newCategoryDesc}
                    onChangeText={setNewCategoryDesc}
                    placeholder="Brief description of this category..."
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    multiline
                    numberOfLines={3}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 12,
                      padding: 16,
                      color: "white",
                      fontSize: 16,
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      textAlignVertical: "top",
                    }}
                  />

                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Pressable
                      onPress={() => {
                        setShowAddForm(false);
                        setNewCategoryName("");
                        setNewCategoryDesc("");
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: 12,
                        padding: 14,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                        Cancel
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleAddCategory}
                      disabled={createMutation.isPending}
                      style={{
                        flex: 1,
                        backgroundColor: "#FF6B35",
                        borderRadius: 12,
                        padding: 14,
                        alignItems: "center",
                        opacity: createMutation.isPending ? 0.7 : 1,
                      }}
                    >
                      {createMutation.isPending ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                          Create
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Categories List */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "white",
                  marginBottom: 16,
                }}
              >
                Your Categories
              </Text>

              {isLoading ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <ActivityIndicator size="large" color="#7E3FE4" />
                </View>
              ) : categories.length === 0 ? (
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 16,
                    padding: 32,
                    alignItems: "center",
                  }}
                >
                  <FolderOpen size={48} color="rgba(255, 255, 255, 0.3)" />
                  <Text
                    style={{
                      fontSize: 16,
                      color: "rgba(255, 255, 255, 0.6)",
                      marginTop: 16,
                      textAlign: "center",
                    }}
                  >
                    No custom categories yet.{"\n"}Create one to get started!
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {categories.map((category) => {
                    const isEditing = editingId === category.id;
                    const color = getCategoryColor(category.color);

                    return (
                      <View
                        key={category.id}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          borderRadius: 16,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: `${color}40`,
                        }}
                      >
                        {isEditing ? (
                          <>
                            <TextInput
                              value={editName}
                              onChangeText={setEditName}
                              placeholder="Category name"
                              placeholderTextColor="rgba(255, 255, 255, 0.4)"
                              style={{
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                borderRadius: 12,
                                padding: 12,
                                color: "white",
                                fontSize: 16,
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: "rgba(255, 255, 255, 0.1)",
                              }}
                            />
                            <TextInput
                              value={editDesc}
                              onChangeText={setEditDesc}
                              placeholder="Description"
                              placeholderTextColor="rgba(255, 255, 255, 0.4)"
                              multiline
                              numberOfLines={2}
                              style={{
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                borderRadius: 12,
                                padding: 12,
                                color: "white",
                                fontSize: 14,
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: "rgba(255, 255, 255, 0.1)",
                                textAlignVertical: "top",
                              }}
                            />
                            <View style={{ flexDirection: "row", gap: 8 }}>
                              <Pressable
                                onPress={cancelEditing}
                                style={{
                                  flex: 1,
                                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                                  borderRadius: 10,
                                  padding: 10,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <X size={18} color="white" />
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: "600",
                                    color: "white",
                                    marginLeft: 6,
                                  }}
                                >
                                  Cancel
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handleUpdateCategory(category.id)}
                                disabled={updateMutation.isPending}
                                style={{
                                  flex: 1,
                                  backgroundColor: color,
                                  borderRadius: 10,
                                  padding: 10,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: updateMutation.isPending ? 0.7 : 1,
                                }}
                              >
                                {updateMutation.isPending ? (
                                  <ActivityIndicator color="white" size="small" />
                                ) : (
                                  <>
                                    <Check size={18} color="white" />
                                    <Text
                                      style={{
                                        fontSize: 14,
                                        fontWeight: "600",
                                        color: "white",
                                        marginLeft: 6,
                                      }}
                                    >
                                      Save
                                    </Text>
                                  </>
                                )}
                              </Pressable>
                            </View>
                          </>
                        ) : (
                          <>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "flex-start",
                                marginBottom: 8,
                              }}
                            >
                              <View
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: color,
                                  marginTop: 6,
                                  marginRight: 12,
                                }}
                              />
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontSize: 18,
                                    fontWeight: "bold",
                                    color: "white",
                                    marginBottom: 4,
                                  }}
                                >
                                  {category.name}
                                </Text>
                                {category.description && (
                                  <Text
                                    style={{
                                      fontSize: 14,
                                      color: "rgba(255, 255, 255, 0.7)",
                                      lineHeight: 20,
                                    }}
                                  >
                                    {category.description}
                                  </Text>
                                )}
                              </View>
                            </View>

                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 12,
                                paddingTop: 12,
                                borderTopWidth: 1,
                                borderTopColor: "rgba(255, 255, 255, 0.1)",
                              }}
                            >
                              {!category.isCustom && (
                                <View
                                  style={{
                                    backgroundColor: "rgba(126, 63, 228, 0.2)",
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      fontWeight: "600",
                                      color: "#7E3FE4",
                                    }}
                                  >
                                    Default
                                  </Text>
                                </View>
                              )}
                              <View style={{ flex: 1 }} />
                              {category.isCustom && (
                                <>
                                  <Pressable
                                    onPress={() => startEditing(category)}
                                    style={{
                                      padding: 8,
                                      marginRight: 8,
                                    }}
                                  >
                                    <Edit2 size={20} color="#00D9FF" />
                                  </Pressable>
                                  <Pressable
                                    onPress={() =>
                                      handleDeleteCategory(category.id, category.name)
                                    }
                                    disabled={deleteMutation.isPending}
                                    style={{
                                      padding: 8,
                                      opacity: deleteMutation.isPending ? 0.5 : 1,
                                    }}
                                  >
                                    <Trash2 size={20} color="#FF3B30" />
                                  </Pressable>
                                </>
                              )}
                            </View>
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
