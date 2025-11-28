#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "StateSyncActor.generated.h"

class UGameStateSync;

/**
 * Example actor that fetches state on BeginPlay and logs values.
 * Add this to a level, set BaseUrl/Profile, and watch Output Log.
 */
UCLASS()
class AStateSyncActor : public AActor
{
    GENERATED_BODY()
public:
    AStateSyncActor();

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="BigHarvest")
    UGameStateSync* Sync;

protected:
    virtual void BeginPlay() override;

    UFUNCTION()
    void HandleFetchOk(const FString& Json);

    UFUNCTION()
    void HandleFetchErr(const FString& Msg);
};
