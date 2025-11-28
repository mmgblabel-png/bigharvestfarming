#include "UGameStateSync.h"

#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Serialization/JsonWriter.h"
#include "Serialization/JsonSerializer.h"

UGameStateSync::UGameStateSync()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UGameStateSync::BeginPlay()
{
    Super::BeginPlay();
    if (bAutoFetchOnBeginPlay)
    {
        FetchState();
    }
}

FString UGameStateSync::BuildUrl(const FString& Path) const
{
    const FString EncProfile = FGenericPlatformHttp::UrlEncode(Profile);
    FString Base = BaseUrl;
    Base.RemoveFromEnd(TEXT("/"));
    return FString::Printf(TEXT("%s%s?profile=%s"), *Base, *Path, *EncProfile);
}

void UGameStateSync::FetchState()
{
    auto& Http = FHttpModule::Get();
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Req = Http.CreateRequest();
    Req->SetURL(BuildUrl(TEXT("/api/state")));
    Req->SetVerb(TEXT("GET"));

    TWeakObjectPtr<UGameStateSync> WeakThis(this);
    Req->OnProcessRequestComplete().BindLambda([WeakThis](FHttpRequestPtr, FHttpResponsePtr Resp, bool bOk)
    {
        if (!WeakThis.IsValid()) return;
        if (!bOk || !Resp.IsValid())
        {
            WeakThis->OnFetchError.Broadcast(TEXT("Network error"));
            return;
        }
        const int32 Code = Resp->GetResponseCode();
        if (Code != 200)
        {
            WeakThis->OnFetchError.Broadcast(FString::Printf(TEXT("HTTP %d"), Code));
            return;
        }
        WeakThis->OnFetchOk.Broadcast(Resp->GetContentAsString());
    });
    Req->ProcessRequest();
}

void UGameStateSync::SaveState(const FString& JsonPayload)
{
    auto& Http = FHttpModule::Get();
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Req = Http.CreateRequest();
    Req->SetURL(BuildUrl(TEXT("/api/state")));
    Req->SetVerb(TEXT("POST"));
    Req->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Req->SetContentAsString(JsonPayload);

    TWeakObjectPtr<UGameStateSync> WeakThis(this);
    Req->OnProcessRequestComplete().BindLambda([WeakThis](FHttpRequestPtr, FHttpResponsePtr Resp, bool bOk)
    {
        if (!WeakThis.IsValid()) return;
        if (!bOk || !Resp.IsValid())
        {
            WeakThis->OnSaveError.Broadcast(TEXT("Network error"));
            return;
        }
        const int32 Code = Resp->GetResponseCode();
        if (Code != 200)
        {
            WeakThis->OnSaveError.Broadcast(FString::Printf(TEXT("HTTP %d"), Code));
            return;
        }
        WeakThis->OnSaveOk.Broadcast();
    });
    Req->ProcessRequest();
}

FString UGameStateSync::MakeMinimalState(int32 Money, int32 Xp)
{
    // Minimal doc respecting expected keys; frontend will expand missing bits safely
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&GWarn);
    FString Out;
    TSharedRef<TJsonWriter<>> W = TJsonWriterFactory<>::Create(&Out);
    W->WriteObjectStart();
    W->WriteValue(TEXT("money"), Money);
    W->WriteValue(TEXT("xp"), Xp);
    // tiles: 20x20 nulls
    W->WriteArrayStart(TEXT("tiles"));
    for (int y = 0; y < 20; ++y)
    {
        W->WriteArrayStart();
        for (int x = 0; x < 20; ++x)
        {
            W->WriteObjectStart();
            W->WriteIdentifierPrefix(TEXT("crop")); W->WriteNull();
            W->WriteIdentifierPrefix(TEXT("cropPlantedAt")); W->WriteNull();
            W->WriteIdentifierPrefix(TEXT("building")); W->WriteNull();
            W->WriteIdentifierPrefix(TEXT("buildingStartedAt")); W->WriteNull();
            W->WriteIdentifierPrefix(TEXT("lastProductCollectedAt")); W->WriteNull();
            W->WriteValue(TEXT("plowed"), false);
            W->WriteValue(TEXT("fertilizedBonus"), false);
            W->WriteObjectEnd();
        }
        W->WriteArrayEnd();
    }
    W->WriteArrayEnd();
    W->WriteArrayStart(TEXT("quests"));
    W->WriteArrayEnd();
    W->WriteObjectEnd();
    W->Close();
    return Out;
}

static void JsonToInventory(const TSharedPtr<FJsonObject>& Obj, FInventoryData& Out)
{
    if (!Obj.IsValid()) return;
    const TSharedPtr<FJsonObject>* InvObj;
    if (Obj->TryGetObjectField(TEXT("inventory"), InvObj))
    {
        auto& I = *InvObj;
        I->TryGetNumberField(TEXT("eggs"), Out.eggs);
        I->TryGetNumberField(TEXT("milk"), Out.milk);
        I->TryGetNumberField(TEXT("grain_pack"), Out.grain_pack);
        I->TryGetNumberField(TEXT("flour"), Out.flour);
        I->TryGetNumberField(TEXT("water"), Out.water);
        I->TryGetNumberField(TEXT("meal"), Out.meal);
        I->TryGetNumberField(TEXT("toolkit"), Out.toolkit);
        I->TryGetNumberField(TEXT("wheat"), Out.wheat);
        I->TryGetNumberField(TEXT("corn"), Out.corn);
        I->TryGetNumberField(TEXT("carrot"), Out.carrot);
        I->TryGetNumberField(TEXT("potato"), Out.potato);
        I->TryGetNumberField(TEXT("tomato"), Out.tomato);
        I->TryGetNumberField(TEXT("pumpkin"), Out.pumpkin);
        I->TryGetNumberField(TEXT("sunflower"), Out.sunflower);
    }
}

static void JsonToStats(const TSharedPtr<FJsonObject>& Obj, FStatsData& Out)
{
    if (!Obj.IsValid()) return;
    const TSharedPtr<FJsonObject>* S;
    if (Obj->TryGetObjectField(TEXT("stats"), S))
    {
        (*S)->TryGetNumberField(TEXT("cropsPlanted"), Out.cropsPlanted);
        (*S)->TryGetNumberField(TEXT("cropsHarvested"), Out.cropsHarvested);
        (*S)->TryGetNumberField(TEXT("productsCollected"), Out.productsCollected);
        (*S)->TryGetNumberField(TEXT("buildingsConstructed"), Out.buildingsConstructed);
        (*S)->TryGetNumberField(TEXT("productsProcessed"), Out.productsProcessed);
        (*S)->TryGetNumberField(TEXT("moneyEarned"), Out.moneyEarned);
    }
}

bool UGameStateSync::ParseStateJson(const FString& Json, FGameStateData& OutState)
{
    TSharedPtr<FJsonObject> Obj;
    auto Reader = TJsonReaderFactory<TCHAR>::Create(Json);
    if (!FJsonSerializer::Deserialize(Reader, Obj) || !Obj.IsValid()) return false;

    int32 Money=0, Xp=0;
    Obj->TryGetNumberField(TEXT("money"), Money);
    Obj->TryGetNumberField(TEXT("xp"), Xp);
    OutState.money = Money;
    OutState.xp = Xp;

    // Tiles
    OutState.TilesFlat.Empty();
    const TArray<TSharedPtr<FJsonValue>>* Rows;
    if (Obj->TryGetArrayField(TEXT("tiles"), Rows))
    {
        for (int y=0; y<Rows->Num() && y<20; ++y)
        {
            const TArray<TSharedPtr<FJsonValue>>* Cols;
            if (!(*Rows)[y]->TryGetArray(Cols)) continue;
            for (int x=0; x<Cols->Num() && x<20; ++x)
            {
                const TSharedPtr<FJsonObject> TileObj = (*Cols)[x]->AsObject();
                if (!TileObj) continue;
                FTileData T;
                TileObj->TryGetStringField(TEXT("crop"), T.crop);
                TileObj->TryGetNumberField(TEXT("cropPlantedAt"), T.cropPlantedAt);
                TileObj->TryGetStringField(TEXT("building"), T.building);
                TileObj->TryGetNumberField(TEXT("buildingStartedAt"), T.buildingStartedAt);
                TileObj->TryGetNumberField(TEXT("lastProductCollectedAt"), T.lastProductCollectedAt);
                TileObj->TryGetBoolField(TEXT("plowed"), T.plowed);
                TileObj->TryGetBoolField(TEXT("fertilizedBonus"), T.fertilizedBonus);
                OutState.TilesFlat.Add(T);
            }
        }
    }

    JsonToInventory(Obj, OutState.Inventory);
    JsonToStats(Obj, OutState.Stats);
    return true;
}

static void InventoryToJson(const FInventoryData& In, TSharedPtr<FJsonObject>& Obj)
{
    auto Inv = MakeShared<FJsonObject>();
    Inv->SetNumberField(TEXT("eggs"), In.eggs);
    Inv->SetNumberField(TEXT("milk"), In.milk);
    Inv->SetNumberField(TEXT("grain_pack"), In.grain_pack);
    Inv->SetNumberField(TEXT("flour"), In.flour);
    Inv->SetNumberField(TEXT("water"), In.water);
    Inv->SetNumberField(TEXT("meal"), In.meal);
    Inv->SetNumberField(TEXT("toolkit"), In.toolkit);
    Inv->SetNumberField(TEXT("wheat"), In.wheat);
    Inv->SetNumberField(TEXT("corn"), In.corn);
    Inv->SetNumberField(TEXT("carrot"), In.carrot);
    Inv->SetNumberField(TEXT("potato"), In.potato);
    Inv->SetNumberField(TEXT("tomato"), In.tomato);
    Inv->SetNumberField(TEXT("pumpkin"), In.pumpkin);
    Inv->SetNumberField(TEXT("sunflower"), In.sunflower);
    Obj->SetObjectField(TEXT("inventory"), Inv);
}

static void StatsToJson(const FStatsData& In, TSharedPtr<FJsonObject>& Obj)
{
    auto S = MakeShared<FJsonObject>();
    S->SetNumberField(TEXT("cropsPlanted"), In.cropsPlanted);
    S->SetNumberField(TEXT("cropsHarvested"), In.cropsHarvested);
    S->SetNumberField(TEXT("productsCollected"), In.productsCollected);
    S->SetNumberField(TEXT("buildingsConstructed"), In.buildingsConstructed);
    S->SetNumberField(TEXT("productsProcessed"), In.productsProcessed);
    S->SetNumberField(TEXT("moneyEarned"), In.moneyEarned);
    Obj->SetObjectField(TEXT("stats"), S);
}

FString UGameStateSync::BuildStateJson(const FGameStateData& In)
{
    auto Obj = MakeShared<FJsonObject>();
    Obj->SetNumberField(TEXT("money"), In.money);
    Obj->SetNumberField(TEXT("xp"), In.xp);

    // Tiles 20x20 (pad with empty if needed)
    TArray<TSharedPtr<FJsonValue>> Rows;
    int idx = 0;
    for (int y=0; y<20; ++y)
    {
        TArray<TSharedPtr<FJsonValue>> Cols;
        for (int x=0; x<20; ++x)
        {
            FTileData T;
            if (In.TilesFlat.IsValidIndex(idx)) T = In.TilesFlat[idx];
            auto TileObj = MakeShared<FJsonObject>();
            if (!T.crop.IsEmpty()) TileObj->SetStringField(TEXT("crop"), T.crop);
            if (T.cropPlantedAt) TileObj->SetNumberField(TEXT("cropPlantedAt"), (double)T.cropPlantedAt);
            if (!T.building.IsEmpty()) TileObj->SetStringField(TEXT("building"), T.building);
            if (T.buildingStartedAt) TileObj->SetNumberField(TEXT("buildingStartedAt"), (double)T.buildingStartedAt);
            if (T.lastProductCollectedAt) TileObj->SetNumberField(TEXT("lastProductCollectedAt"), (double)T.lastProductCollectedAt);
            TileObj->SetBoolField(TEXT("plowed"), T.plowed);
            TileObj->SetBoolField(TEXT("fertilizedBonus"), T.fertilizedBonus);
            Cols.Add(MakeShared<FJsonValueObject>(TileObj));
            ++idx;
        }
        Rows.Add(MakeShared<FJsonValueArray>(Cols));
    }
    Obj->SetArrayField(TEXT("tiles"), Rows);

    InventoryToJson(In.Inventory, Obj);
    StatsToJson(In.Stats, Obj);

    FString Out;
    auto Writer = TJsonWriterFactory<TCHAR>::Create(&Out);
    FJsonSerializer::Serialize(Obj.ToSharedRef(), Writer);
    return Out;
}
