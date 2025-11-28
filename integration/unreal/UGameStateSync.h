#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "UGameStateSync.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnStateJson, const FString&, Json);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnStateError, const FString&, Message);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnStateSaved);

USTRUCT(BlueprintType)
struct FTileData
{
    GENERATED_BODY()
    UPROPERTY(EditAnywhere, BlueprintReadWrite) FString crop;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int64 cropPlantedAt = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) FString building;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int64 buildingStartedAt = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int64 lastProductCollectedAt = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) bool plowed = false;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) bool fertilizedBonus = false;
};

USTRUCT(BlueprintType)
struct FInventoryData
{
    GENERATED_BODY()
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 eggs = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 milk = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 grain_pack = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 flour = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 water = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 meal = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 toolkit = 0;
    // Common crops (subset shown)
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 wheat = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 corn = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 carrot = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 potato = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 tomato = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 pumpkin = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 sunflower = 0;
};

USTRUCT(BlueprintType)
struct FStatsData
{
    GENERATED_BODY()
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 cropsPlanted = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 cropsHarvested = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 productsCollected = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 buildingsConstructed = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 productsProcessed = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 moneyEarned = 0;
};

USTRUCT(BlueprintType)
struct FGameStateData
{
    GENERATED_BODY()
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 money = 0;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 xp = 0;
    // Flattened 20x20 tiles (index = y*20 + x)
    UPROPERTY(EditAnywhere, BlueprintReadWrite) TArray<FTileData> TilesFlat;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) FInventoryData Inventory;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) FStatsData Stats;
};

/**
 * UGameStateSync
 *
 * Drop-in UE5 component that syncs with the Flask backend in this repo.
 * - GET /api/state?profile=<Profile>
 * - POST /api/state?profile=<Profile>
 *
 * Exposes Blueprint-callable methods and events for success/error.
 */
UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class UGameStateSync : public UActorComponent
{
    GENERATED_BODY()

public:
    UGameStateSync();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="BigHarvest|Sync")
    FString BaseUrl = TEXT("http://127.0.0.1:5000");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="BigHarvest|Sync")
    FString Profile = TEXT("ue");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="BigHarvest|Sync")
    bool bAutoFetchOnBeginPlay = true;

    // GET state as raw JSON string
    UFUNCTION(BlueprintCallable, Category="BigHarvest|Sync")
    void FetchState();

    // POST state from raw JSON string (must match frontend schema)
    UFUNCTION(BlueprintCallable, Category="BigHarvest|Sync")
    void SaveState(const FString& JsonPayload);

    // Convenience: make a minimal valid state document
    UFUNCTION(BlueprintCallable, Category="BigHarvest|Sync")
    static FString MakeMinimalState(int32 Money, int32 Xp);

    // Parse JSON into structured data (returns false on parse failure)
    UFUNCTION(BlueprintCallable, Category="BigHarvest|Sync")
    static bool ParseStateJson(const FString& Json, FGameStateData& OutState);

    // Build JSON from structured data (20x20 tiles expected if provided)
    UFUNCTION(BlueprintCallable, Category="BigHarvest|Sync")
    static FString BuildStateJson(const FGameStateData& InState);

    UPROPERTY(BlueprintAssignable, Category="BigHarvest|Events")
    FOnStateJson OnFetchOk;

    UPROPERTY(BlueprintAssignable, Category="BigHarvest|Events")
    FOnStateError OnFetchError;

    UPROPERTY(BlueprintAssignable, Category="BigHarvest|Events")
    FOnStateSaved OnSaveOk;

    UPROPERTY(BlueprintAssignable, Category="BigHarvest|Events")
    FOnStateError OnSaveError;

protected:
    virtual void BeginPlay() override;

private:
    FString BuildUrl(const FString& Path) const;
};
