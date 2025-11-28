#include "StateSyncActor.h"
#include "UGameStateSync.h"

AStateSyncActor::AStateSyncActor()
{
    PrimaryActorTick.bCanEverTick = false;
    Sync = CreateDefaultSubobject<UGameStateSync>(TEXT("GameStateSync"));
}

void AStateSyncActor::BeginPlay()
{
    Super::BeginPlay();
    if (Sync)
    {
        Sync->OnFetchOk.AddDynamic(this, &AStateSyncActor::HandleFetchOk);
        Sync->OnFetchError.AddDynamic(this, &AStateSyncActor::HandleFetchErr);
        if (!Sync->bAutoFetchOnBeginPlay)
        {
            Sync->FetchState();
        }
    }
}

void AStateSyncActor::HandleFetchOk(const FString& Json)
{
    UE_LOG(LogTemp, Log, TEXT("[BigHarvest] Fetch OK: %s"), *Json.Left(256));
}

void AStateSyncActor::HandleFetchErr(const FString& Msg)
{
    UE_LOG(LogTemp, Warning, TEXT("[BigHarvest] Fetch ERROR: %s"), *Msg);
}
